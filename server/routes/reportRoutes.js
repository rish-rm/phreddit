import express from "express";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import { requireAdmin, requireLogin } from "../middleware/auth.js";
import { deletePostAndComments } from "../utils/cascadeDelete.js";
import { requireNonEmptyString } from "../utils/validation.js";

const router = express.Router();
const VALID_REASONS = new Set(["spam", "harassment", "off-topic", "other"]);

function normalizeReason(value) {
  const reason = requireNonEmptyString(value, "Report reason");
  if (!VALID_REASONS.has(reason)) {
    const error = new Error("Report reason must be spam, harassment, off-topic, or other.");
    error.status = 400;
    throw error;
  }
  return reason;
}

function normalizeOptionalNote(value, fieldName) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    const error = new Error(`${fieldName} must be text.`);
    error.status = 400;
    throw error;
  }
  const trimmed = value.trim();
  if (trimmed.length > 400) {
    const error = new Error(`${fieldName} must be 400 characters or less.`);
    error.status = 400;
    throw error;
  }
  return trimmed;
}

function populateReport(query) {
  return query
    .populate("reportedBy", "displayName reputation")
    .populate("resolvedBy", "displayName")
    .populate({
      path: "targetPost",
      select: "title content community postedBy createdAt",
      populate: [
        { path: "community", select: "name" },
        { path: "postedBy", select: "displayName reputation" }
      ]
    });
}

router.post("/posts/:postId", requireLogin, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    if (String(post.postedBy) === String(req.currentUser._id)) {
      return res.status(400).json({ error: "You cannot report your own post." });
    }

    const reason = normalizeReason(req.body.reason);
    const details = normalizeOptionalNote(req.body.details, "Report details");
    const existingReport = await Report.findOne({
      targetPost: post._id,
      reportedBy: req.currentUser._id,
      status: "pending"
    });

    if (existingReport) {
      return res.status(409).json({ error: "You already have a pending report for this post." });
    }

    const report = await Report.create({
      targetPost: post._id,
      reportedBy: req.currentUser._id,
      reason,
      details
    });

    return res.status(201).json({
      message: "Report submitted for moderator review.",
      report
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireLogin, requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status || "pending";
    const filter = {};

    if (status !== "all") {
      if (!["pending", "dismissed", "content_removed"].includes(status)) {
        return res.status(400).json({ error: "Invalid report status." });
      }
      filter.status = status;
    }

    const reports = await populateReport(
      Report.find(filter).sort({ createdAt: -1 }).limit(50)
    );

    return res.json({ reports });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/resolve", requireLogin, requireAdmin, async (req, res, next) => {
  try {
    const action = req.body.action;
    if (!["dismiss", "delete_post"].includes(action)) {
      return res.status(400).json({ error: "Resolution action must be dismiss or delete_post." });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    if (report.status !== "pending") {
      return res.status(409).json({ error: "This report has already been resolved." });
    }

    const resolutionNote = normalizeOptionalNote(req.body.note, "Resolution note");

    if (action === "delete_post") {
      await deletePostAndComments(report.targetPost, { deleteReports: false });
      await Report.updateMany(
        { targetPost: report.targetPost, status: "pending" },
        {
          $set: {
            status: "content_removed",
            resolvedBy: req.currentUser._id,
            resolvedAt: new Date(),
            resolutionNote
          }
        }
      );
    } else {
      report.status = "dismissed";
      report.resolvedBy = req.currentUser._id;
      report.resolvedAt = new Date();
      report.resolutionNote = resolutionNote;
      await report.save();
    }

    const reports = await populateReport(
      Report.find({ status: "pending" }).sort({ createdAt: -1 }).limit(50)
    );

    return res.json({
      message: action === "delete_post" ? "Reported post deleted." : "Report dismissed.",
      reports
    });
  } catch (error) {
    next(error);
  }
});

export default router;
