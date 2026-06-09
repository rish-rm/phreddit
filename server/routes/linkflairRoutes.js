import express from "express";
import LinkFlair from "../models/LinkFlair.js";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const linkFlairs = await LinkFlair.find({}).sort({ content: 1 });
    res.json({ linkFlairs });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ error: "Content is required." });
    if (content.length > 30) {
      return res.status(400).json({ error: "Link flair must be 30 characters or less." });
    }
    let linkFlair = await LinkFlair.findOne({ content });
    if (!linkFlair) linkFlair = await LinkFlair.create({ content });
    res.status(201).json({ linkFlair });
  } catch (error) {
    next(error);
  }
});

export default router;
