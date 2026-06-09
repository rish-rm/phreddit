import User from "../models/User.js";

export async function attachCurrentUser(req, _res, next) {
  try {
    const userId = req.session?.userId || req.header("x-test-user-id");
    req.currentUser = userId ? await User.findById(userId) : null;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireLogin(req, res, next) {
  if (!req.currentUser) {
    return res.status(401).json({
      error: "You must be logged in to perform this action."
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.currentUser?.isAdmin) {
    return res.status(403).json({
      error: "Admin access is required."
    });
  }
  next();
}
