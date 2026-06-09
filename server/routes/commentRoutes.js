import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { requireLogin } from "../middleware/auth.js";
import { deleteCommentAndReplies } from "../utils/cascadeDelete.js";
import {
  canUserVote,
  hasUserAlreadyVoted,
  reputationDeltaForVote
} from "../utils/voting.js";
import { requireNonEmptyString } from "../utils/validation.js";

const router = express.Router();

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const content = requireNonEmptyString(req.body.content, "Comment content");
    const postId = requireNonEmptyString(req.body.post, "Post");

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    const parentComment = req.body.parentComment
      ? await Comment.findById(req.body.parentComment)
      : null;

    if (req.body.parentComment && !parentComment) {
      return res.status(404).json({
        error: "Parent comment not found."
      });
    }

    if (parentComment && String(parentComment.post) !== String(post._id)) {
      return res.status(400).json({
        error: "Parent comment does not belong to this post."
      });
    }

    const comment = await Comment.create({
      content,
      commentedBy: req.currentUser._id,
      post: post._id,
      parentComment: parentComment?._id || null,
      replies: [],
      upvotes: 0,
      downvotes: 0,
      votedBy: []
    });

    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment._id, {
        $addToSet: {
          replies: comment._id
        }
      });
    } else {
      await Post.findByIdAndUpdate(post._id, {
        $addToSet: {
          comments: comment._id
        }
      });
    }

    await User.findByIdAndUpdate(req.currentUser._id, {
      $addToSet: {
        createdComments: comment._id
      }
    });

    return res.status(201).json({
      message: "Comment created successfully.",
      comment
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireLogin, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        error: "Comment not found."
      });
    }

    if (!req.currentUser.isAdmin && String(comment.commentedBy) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only edit comments you created."
      });
    }

    comment.content = requireNonEmptyString(req.body.content, "Comment content");
    await comment.save();

    return res.json({
      message: "Comment updated successfully.",
      comment
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireLogin, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        error: "Comment not found."
      });
    }

    if (!req.currentUser.isAdmin && String(comment.commentedBy) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only delete comments you created."
      });
    }

    await deleteCommentAndReplies(comment._id);

    return res.json({
      message: "Comment deleted successfully."
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

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        error: "Comment not found."
      });
    }

    if (hasUserAlreadyVoted(comment.votedBy, req.currentUser._id)) {
      return res.status(409).json({
        error: "You can only vote on a comment once."
      });
    }

    if (voteType === "upvote") {
      comment.upvotes += 1;
    } else {
      comment.downvotes += 1;
    }

    comment.votedBy.push({
      user: req.currentUser._id,
      voteType
    });

    await comment.save();

    const updatedCommenter = await User.findByIdAndUpdate(
      comment.commentedBy,
      {
        $inc: {
          reputation: reputationDeltaForVote(voteType)
        }
      },
      { new: true }
    );

    return res.json({
      message: "Vote recorded successfully.",
      comment,
      commenterReputation: updatedCommenter.reputation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
