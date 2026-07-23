import User from "../models/User.js";
import { validateEmail } from "./validation.js";

export async function ensureConfiguredAdmin({
  adminEmail = process.env.ADMIN_EMAIL,
  userModel = User
} = {}) {
  const email = String(adminEmail || "").trim().toLowerCase();
  if (!email) {
    return { configured: false, reason: "not-configured" };
  }

  if (!validateEmail(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  const result = await userModel.updateOne(
    { email },
    {
      $set: { isAdmin: true },
      $max: { reputation: 1000 }
    }
  );

  if (result.matchedCount === 0) {
    return { configured: false, reason: "not-found" };
  }

  return { configured: true };
}
