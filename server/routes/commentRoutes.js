import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { requireLogin } from "../middleware/auth.js";
import { deleteCommentAndReplies } from "../utils/cascadeDelete.js";
import { canUserVote } from "../utils/voting.js";
import { applyVote } from "../utils/voteService.js";
import { presentVotable } from "../utils/serialize.js";
import { requireNonEmptyString, requireValidUserContent } from "../utils/validation.js";
import { emitPostUpdated } from "../realtime.js";

const router = express.Router();

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const content = requireValidUserContent(req.body.content, "Comment content", 500);
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

    emitPostUpdated(post._id);

    return res.status(201).json({
      message: "Comment created successfully.",
      comment: presentVotable(comment, req.currentUser._id)
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

    comment.content = requireValidUserContent(req.body.content, "Comment content", 500);
    await comment.save();
    emitPostUpdated(comment.post);

    return res.json({
      message: "Comment updated successfully.",
      comment: presentVotable(comment, req.currentUser._id)
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

    if (String(comment.commentedBy) === String(req.currentUser._id)) {
      return res.status(400).json({
        error: "You cannot vote on your own comment."
      });
    }

    const result = await applyVote(Comment, comment._id, req.currentUser._id, voteType);
    if (!result) {
      return res.status(409).json({
        error: "Vote could not be applied. Please try again."
      });
    }

    let commenterReputation = null;
    if (result.repDelta !== 0) {
      const updatedCommenter = await User.findByIdAndUpdate(
        comment.commentedBy,
        { $inc: { reputation: result.repDelta } },
        { new: true }
      );
      commenterReputation = updatedCommenter?.reputation ?? null;
    }

    emitPostUpdated(comment.post);

    return res.json({
      message:
        result.action === "removed"
          ? "Vote removed."
          : result.action === "switched"
            ? "Vote changed."
            : "Vote recorded successfully.",
      comment: presentVotable(result.doc, req.currentUser._id),
      commenterReputation
    });
  } catch (error) {
    next(error);
  }
});

export default router;
