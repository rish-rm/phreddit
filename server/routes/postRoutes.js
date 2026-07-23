import express from "express";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import LinkFlair from "../models/LinkFlair.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { requireLogin } from "../middleware/auth.js";
import { deletePostAndComments } from "../utils/cascadeDelete.js";
import { canUserVote } from "../utils/voting.js";
import { applyVote } from "../utils/voteService.js";
import { attachPostStats } from "../utils/postStats.js";
import { presentVotable } from "../utils/serialize.js";
import {
  requireLength,
  requireNonEmptyString,
  requireValidUserContent
} from "../utils/validation.js";
import { emitPostUpdated } from "../realtime.js";

const router = express.Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const SORTS = new Set(["newest", "oldest", "active"]);

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(1, requestedLimit), MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
}

function toObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName} id.`);
    error.status = 400;
    throw error;
  }
  return new mongoose.Types.ObjectId(String(value));
}

// Builds the Mongo filter for listings. Ids are cast explicitly because the
// filter is also fed to an aggregation pipeline, which (unlike find) does
// not auto-cast strings to ObjectIds. Search uses the text indexes on posts
// and comments ($text cannot live inside $or, so matching ids are resolved
// first and folded into the filter).
async function buildListFilter(query) {
  const filter = {};

  if (query.community) {
    filter.community = toObjectId(query.community, "community");
  }

  if (query.linkFlair) {
    filter.linkFlair = toObjectId(query.linkFlair, "link flair");
  }

  const search = String(query.search || "").trim();
  if (search) {
    const [postMatches, commentMatches] = await Promise.all([
      Post.find({ $text: { $search: search } }).select("_id"),
      Comment.find({ $text: { $search: search } }).select("post")
    ]);

    const uniqueIds = new Set([
      ...postMatches.map((doc) => String(doc._id)),
      ...commentMatches.map((doc) => String(doc.post))
    ]);
    filter._id = {
      $in: [...uniqueIds].map((id) => new mongoose.Types.ObjectId(id))
    };
  }

  return filter;
}

function hydratePostsQuery(query) {
  return query
    .populate("postedBy", "displayName")
    .populate("community", "name")
    .populate("linkFlair", "content");
}

function joinedCommunityIds(currentUser) {
  return (currentUser?.joinedCommunities || []).map(
    (id) => new mongoose.Types.ObjectId(String(id))
  );
}

function joinedRankStage(joinedIds) {
  if (joinedIds.length === 0) {
    return { $addFields: { joinedRank: 0 } };
  }
  return {
    $addFields: {
      joinedRank: { $cond: [{ $in: ["$community", joinedIds] }, 1, 0] }
    }
  };
}

async function hydrateOrderedPosts(ordered) {
  const orderedIds = ordered.map((item) => String(item._id));
  const docs = await hydratePostsQuery(Post.find({ _id: { $in: orderedIds } }));
  const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
  return orderedIds.map((id) => docsById.get(id)).filter(Boolean);
}

async function listStandardPosts(filter, skip, limit, direction, joinedIds) {
  const ordered = await Post.aggregate([
    { $match: filter },
    joinedRankStage(joinedIds),
    { $sort: { joinedRank: -1, createdAt: direction, _id: direction } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 1 } }
  ]);
  return hydrateOrderedPosts(ordered);
}

async function normalizeLinkFlair(value) {
  if (value === undefined || value === null || value === "") return null;
  const flairId = toObjectId(value, "link flair");
  if (!(await LinkFlair.exists({ _id: flairId }))) {
    const error = new Error("Link flair not found.");
    error.status = 400;
    throw error;
  }
  return flairId;
}

// "Active" ranks posts with comment activity first (by latest comment or
// reply), then quiet posts by creation date. Computed in an aggregation so
// it can be sorted and paginated database-side.
async function listActivePosts(filter, skip, limit, joinedIds) {
  const ordered = await Post.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "comments",
        let: { postId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$post", "$$postId"] } } },
          {
            $group: {
              _id: null,
              commentCount: { $sum: 1 },
              latestCommentAt: { $max: "$createdAt" }
            }
          }
        ],
        as: "commentStats"
      }
    },
    {
      $addFields: {
        commentCount: {
          $ifNull: [{ $arrayElemAt: ["$commentStats.commentCount", 0] }, 0]
        },
        latestCommentAt: {
          $arrayElemAt: ["$commentStats.latestCommentAt", 0]
        }
      }
    },
    {
      $addFields: {
        hasComments: { $gt: ["$commentCount", 0] }
      }
    },
    {
      $addFields: {
        activityAt: { $cond: ["$hasComments", "$latestCommentAt", "$createdAt"] }
      }
    },
    joinedRankStage(joinedIds),
    { $sort: { joinedRank: -1, hasComments: -1, activityAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 1, commentCount: 1, latestCommentAt: 1 } }
  ]);

  const orderedIds = ordered.map((item) => String(item._id));
  const statsById = new Map(
    ordered.map((item) => [
      String(item._id),
      { commentCount: item.commentCount, latestCommentAt: item.latestCommentAt || null }
    ])
  );

  const docs = await hydrateOrderedPosts(ordered);
  const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));

  return orderedIds
    .map((id) => ({ doc: docsById.get(id), stats: statsById.get(id) }))
    .filter((item) => item.doc);
}

router.get("/", async (req, res, next) => {
  try {
    const sort = SORTS.has(req.query.sort) ? req.query.sort : "newest";
    const { page, limit, skip } = parsePagination(req.query);
    const filter = await buildListFilter(req.query);
    const currentUserId = req.currentUser?._id || null;
    const joinedIds = joinedCommunityIds(req.currentUser);

    const total = await Post.countDocuments(filter);

    let posts;
    if (sort === "active") {
      const items = await listActivePosts(filter, skip, limit, joinedIds);
      posts = items.map(({ doc, stats }) => ({
        ...presentVotable(doc, currentUserId),
        commentCount: stats?.commentCount ?? 0,
        latestCommentAt: stats?.latestCommentAt ?? null
      }));
    } else {
      const direction = sort === "oldest" ? 1 : -1;
      const docs = await listStandardPosts(filter, skip, limit, direction, joinedIds);
      posts = await attachPostStats(docs, currentUserId);
    }

    return res.json({
      posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
      sort
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("postedBy", "displayName reputation")
      .populate("community", "name")
      .populate("linkFlair", "content");

    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    const currentUserId = req.currentUser?._id || null;

    // Comments are fetched flat in one indexed query and assembled into a
    // tree in memory, so thread depth is unbounded (the previous nested
    // populate silently truncated replies beyond a fixed depth).
    const comments = await Comment.find({ post: post._id })
      .populate("commentedBy", "displayName reputation")
      .sort({ createdAt: -1 })
      .lean();

    const byId = new Map();
    for (const comment of comments) {
      const presented = presentVotable(comment, currentUserId);
      presented.replies = [];
      byId.set(String(presented._id), presented);
    }

    const rootComments = [];
    for (const comment of byId.values()) {
      const parentId = comment.parentComment ? String(comment.parentComment) : null;
      const parent = parentId ? byId.get(parentId) : null;
      if (parent) {
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    }

    let latestCommentAt = null;
    for (const comment of comments) {
      if (!latestCommentAt || comment.createdAt > latestCommentAt) {
        latestCommentAt = comment.createdAt;
      }
    }

    const presentedPost = {
      ...presentVotable(post, currentUserId),
      comments: rootComments,
      commentCount: comments.length,
      latestCommentAt
    };

    return res.json({ post: presentedPost });
  } catch (error) {
    next(error);
  }
});

// View counting is an explicit action, keeping GET requests idempotent.
router.post("/:id/view", async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }
    return res.json({ views: post.views });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const title = requireLength(req.body.title, "Post title", 100);
    const content = requireValidUserContent(req.body.content, "Post content");
    const communityId = requireNonEmptyString(req.body.community, "Community");
    const linkFlair = await normalizeLinkFlair(req.body.linkFlair);

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
      linkFlair,
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
      post.title = requireLength(req.body.title, "Post title", 100);
    }
    if (Object.hasOwn(req.body, "content")) {
      post.content = requireValidUserContent(req.body.content, "Post content");
    }
    if (Object.hasOwn(req.body, "linkFlair")) {
      post.linkFlair = await normalizeLinkFlair(req.body.linkFlair);
    }

    await post.save();
    emitPostUpdated(post._id);

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
      return res.status(400).json({
        error: "You cannot vote on your own post."
      });
    }

    const result = await applyVote(Post, post._id, req.currentUser._id, voteType);
    if (!result) {
      return res.status(409).json({
        error: "Vote could not be applied. Please try again."
      });
    }

    let posterReputation = null;
    if (result.repDelta !== 0) {
      const updatedPoster = await User.findByIdAndUpdate(
        post.postedBy,
        { $inc: { reputation: result.repDelta } },
        { new: true }
      );
      posterReputation = updatedPoster?.reputation ?? null;
    }

    emitPostUpdated(post._id);

    return res.json({
      message:
        result.action === "removed"
          ? "Vote removed."
          : result.action === "switched"
            ? "Vote changed."
            : "Vote recorded successfully.",
      post: presentVotable(result.doc, req.currentUser._id),
      posterReputation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
