import express from "express";
import Community from "../models/Community.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { requireLogin } from "../middleware/auth.js";
import { deletePostAndComments } from "../utils/cascadeDelete.js";
import {
  applyVoteChangeToDocument,
  canUserVote,
  presentVotable,
  resolveVoteChange
} from "../utils/voting.js";
import { buildCommentTree } from "../utils/commentTree.js";
import { attachPostStats } from "../utils/postStats.js";
import { requireNonEmptyString } from "../utils/validation.js";

const router = express.Router();

function populatePost(query) {
  return query
    .populate("postedBy", "displayName reputation")
    .populate("community", "name")
    .populate("linkFlair", "content");
}

function messageForVoteAction(action) {
  if (action === "removed") return "Vote removed successfully.";
  if (action === "switched") return "Vote switched successfully.";
  return "Vote recorded successfully.";
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.community) {
      filter.community = req.query.community;
    }

    if (req.query.linkFlair) {
      filter.linkFlair = req.query.linkFlair;
    }

    if (req.query.search) {
      const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const terms = String(req.query.search)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(escape);

      if (terms.length > 0) {
        const orConditions = [];
        for (const term of terms) {
          const wordRegex = new RegExp(`\\b${term}\\b`, "i");
          orConditions.push({ title: wordRegex });
          orConditions.push({ content: wordRegex });
        }
        const commentRegexes = terms.map((t) => new RegExp(`\\b${t}\\b`, "i"));
        const matchingComments = await Comment.find({
          $or: commentRegexes.map((re) => ({ content: re }))
        }).select("post");
        if (matchingComments.length > 0) {
          orConditions.push({
            _id: { $in: matchingComments.map((c) => c.post) }
          });
        }
        filter.$or = orConditions;
      }
    }

    const posts = await Post.find(filter)
      .populate("postedBy", "displayName")
      .populate("community", "name")
      .populate("linkFlair", "content")
      .populate("comments", "createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      posts: await attachPostStats(posts, { currentUserId: req.currentUser?._id })
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const post = await populatePost(Post.findById(req.params.id));
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    if (req.query.incrementView !== "false") {
      post.views += 1;
      await post.save();
    }

    const [postWithStats] = await attachPostStats([post], {
      currentUserId: req.currentUser?._id
    });
    const comments = await Comment.find({ post: post._id })
      .populate("commentedBy", "displayName reputation")
      .sort({ createdAt: -1 });

    postWithStats.comments = buildCommentTree(comments, req.currentUser?._id);

    return res.json({ post: postWithStats });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const title = requireNonEmptyString(req.body.title, "Post title");
    const content = requireNonEmptyString(req.body.content, "Post content");
    const communityId = requireNonEmptyString(req.body.community, "Community");

    if (title.length > 100) {
      return res.status(400).json({
        error: "Post title must be 100 characters or less."
      });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    const post = await Post.create({
      title,
      content,
      community: community._id,
      postedBy: req.currentUser._id,
      linkFlair: req.body.linkFlair || null,
      views: 0,
      comments: [],
      upvotes: 0,
      downvotes: 0,
      votedBy: []
    });

    await Community.findByIdAndUpdate(community._id, {
      $addToSet: {
        posts: post._id
      }
    });

    await User.findByIdAndUpdate(req.currentUser._id, {
      $addToSet: {
        createdPosts: post._id
      }
    });

    return res.status(201).json({
      message: "Post created successfully.",
      post: presentVotable(post, req.currentUser._id)
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireLogin, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    if (!req.currentUser.isAdmin && String(post.postedBy) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only edit posts you created."
      });
    }

    if (Object.hasOwn(req.body, "title")) {
      const title = requireNonEmptyString(req.body.title, "Post title");
      if (title.length > 100) {
        return res.status(400).json({
          error: "Post title must be 100 characters or less."
        });
      }
      post.title = title;
    }
    if (Object.hasOwn(req.body, "content")) {
      post.content = requireNonEmptyString(req.body.content, "Post content");
    }
    if (Object.hasOwn(req.body, "linkFlair")) {
      post.linkFlair = req.body.linkFlair || null;
    }

    await post.save();

    return res.json({
      message: "Post updated successfully.",
      post: presentVotable(post, req.currentUser._id)
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireLogin, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    if (!req.currentUser.isAdmin && String(post.postedBy) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only delete posts you created."
      });
    }

    await deletePostAndComments(post._id);

    return res.json({
      message: "Post deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/vote", requireLogin, async (req, res, next) => {
  try {
    const voteType = req.body.voteType;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        error: "voteType must be upvote or downvote."
      });
    }

    if (!canUserVote(req.currentUser)) {
      return res.status(403).json({
        error: "Users with reputation below 50 cannot vote."
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    if (String(post.postedBy) === String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You cannot vote on your own post."
      });
    }

    const voteChange = resolveVoteChange(post.votedBy, req.currentUser._id, voteType);
    applyVoteChangeToDocument(post, req.currentUser._id, voteChange);
    await post.save();

    const updatedPoster = await User.findByIdAndUpdate(
      post.postedBy,
      {
        $inc: {
          reputation: voteChange.reputationDelta
        }
      },
      { new: true }
    );

    return res.json({
      message: messageForVoteAction(voteChange.action),
      post: presentVotable(post, req.currentUser._id),
      currentVote: voteChange.currentVote,
      posterReputation: updatedPoster.reputation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
