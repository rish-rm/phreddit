import express from "express";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { requireAdmin, requireLogin } from "../middleware/auth.js";
import { deleteUserCascade } from "../utils/cascadeDelete.js";

const router = express.Router();

router.get("/me", requireLogin, async (req, res) => {
  return res.json({
    user: req.currentUser
  });
});

router.get("/", requireLogin, requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find({
      isAdmin: false
    }).sort({ displayName: 1 });
    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/profile-content", requireLogin, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!req.currentUser.isAdmin && String(req.currentUser._id) !== String(targetUserId)) {
      return res.status(403).json({
        error: "You do not have permission to view this profile content."
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const communities = await Community.find({
      creator: user._id
    }).sort({ createdAt: -1 });

    const posts = await Post.find({
      postedBy: user._id
    })
      .populate("community", "name")
      .sort({ createdAt: -1 });

    const comments = await Comment.find({
      commentedBy: user._id
    })
      .populate("post", "title")
      .sort({ createdAt: -1 });

    return res.json({
      user,
      communities,
      posts,
      comments
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireLogin, requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        error: "Admin users cannot be deleted through this route."
      });
    }

    await deleteUserCascade(user._id);

    return res.json({
      message: "User deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
