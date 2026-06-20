import express from "express";
import Community from "../models/Community.js";
import User from "../models/User.js";
import { requireLogin } from "../middleware/auth.js";
import { deleteCommunityCascade } from "../utils/cascadeDelete.js";
import { attachPostStats } from "../utils/postStats.js";
import { requireNonEmptyString } from "../utils/validation.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const communities = await Community.find({})
      .populate("creator", "displayName")
      .populate("members", "displayName")
      .sort({ name: 1 });

    if (!req.currentUser) {
      return res.json({ communities });
    }

    const joined = new Set(
      req.currentUser.joinedCommunities.map((id) => String(id))
    );

    communities.sort((a, b) => {
      const aJoined = joined.has(String(a._id));
      const bJoined = joined.has(String(b._id));
      if (aJoined !== bJoined) {
        return aJoined ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return res.json({ communities });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("creator", "displayName")
      .populate({
        path: "posts",
        populate: [
          { path: "postedBy", select: "displayName" },
          { path: "community", select: "name" },
          { path: "linkFlair", select: "content" }
        ]
      });

    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    const communityData = community.toObject({ virtuals: true });
    communityData.posts = await attachPostStats(community.posts || []);

    return res.json({ community: communityData });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const name = requireNonEmptyString(req.body.name, "Community name");
    const description = requireNonEmptyString(req.body.description, "Community description");

    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(409).json({
        error: "Community names must be unique."
      });
    }

    const community = await Community.create({
      name,
      description,
      creator: req.currentUser._id,
      members: [req.currentUser._id],
      posts: []
    });

    await User.findByIdAndUpdate(req.currentUser._id, {
      $addToSet: {
        createdCommunities: community._id,
        joinedCommunities: community._id
      }
    });

    return res.status(201).json({
      message: "Community created successfully.",
      community
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireLogin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    if (!req.currentUser.isAdmin && String(community.creator) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only edit communities you created."
      });
    }

    if (Object.hasOwn(req.body, "name")) {
      const name = requireNonEmptyString(req.body.name, "Community name");
      if (name !== community.name) {
        const existing = await Community.findOne({ name });
        if (existing) {
          return res.status(409).json({
            error: "Community names must be unique."
          });
        }
        community.name = name;
      }
    }

    if (Object.hasOwn(req.body, "description")) {
      community.description = requireNonEmptyString(
        req.body.description,
        "Community description"
      );
    }

    await community.save();

    return res.json({
      message: "Community updated successfully.",
      community
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireLogin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    if (!req.currentUser.isAdmin && String(community.creator) !== String(req.currentUser._id)) {
      return res.status(403).json({
        error: "You can only delete communities you created."
      });
    }

    await deleteCommunityCascade(community._id);

    return res.json({
      message: "Community deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/join", requireLogin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    await Community.findByIdAndUpdate(community._id, {
      $addToSet: {
        members: req.currentUser._id
      }
    });

    await User.findByIdAndUpdate(req.currentUser._id, {
      $addToSet: {
        joinedCommunities: community._id
      }
    });

    return res.json({
      message: "Joined community successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/leave", requireLogin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({
        error: "Community not found."
      });
    }

    await Community.findByIdAndUpdate(community._id, {
      $pull: {
        members: req.currentUser._id
      }
    });

    await User.findByIdAndUpdate(req.currentUser._id, {
      $pull: {
        joinedCommunities: community._id
      }
    });

    return res.json({
      message: "Left community successfully."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
