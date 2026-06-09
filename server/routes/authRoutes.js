import bcrypt from "bcrypt";
import express from "express";
import User from "../models/User.js";
import { validateRegistrationInput } from "../utils/validation.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const validation = validateRegistrationInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ errors: validation.errors });
    }

    const email = req.body.email.trim().toLowerCase();
    const displayName = req.body.displayName.trim();

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        error: "An account with that email already exists."
      });
    }

    const existingDisplayName = await User.findOne({ displayName });
    if (existingDisplayName) {
      return res.status(409).json({
        error: "That display name is already taken."
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);

    const user = await User.create({
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email,
      displayName,
      passwordHash,
      reputation: 100,
      isAdmin: false
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    req.session.userId = String(user._id);

    return res.json({
      message: "Logged in successfully.",
      user
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "Logout failed."
      });
    }

    res.clearCookie("connect.sid");
    return res.json({
      message: "Logged out successfully."
    });
  });
});

router.get("/me", async (req, res) => {
  if (!req.currentUser) {
    return res.json({ user: null });
  }
  return res.json({ user: req.currentUser });
});

export default router;
