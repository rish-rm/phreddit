import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import LinkFlair from "../models/LinkFlair.js";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import User from "../models/User.js";

function uniqueMongoUri(baseUri) {
  const fallbackDbName = "phreddit_test";
  const suffix = `${process.pid}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const url = new URL(baseUri);
    const dbName = url.pathname.replace(/^\//, "") || fallbackDbName;
    url.pathname = `/${dbName}_${suffix}`;
    return url.toString();
  } catch {
    return `mongodb://127.0.0.1:27017/${fallbackDbName}_${suffix}`;
  }
}

export const TEST_MONGO_URI = uniqueMongoUri(
  process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/phreddit_test"
);

export async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
}

export async function clearTestDb() {
  await Promise.all([
    User.deleteMany({}),
    Community.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    LinkFlair.deleteMany({}),
    Report.deleteMany({})
  ]);
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

export async function createTestUser(overrides = {}) {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  return User.create({
    firstName: "Test",
    lastName: "User",
    email: `test${stamp}@example.com`,
    displayName: `testuser${stamp}`,
    passwordHash: await bcrypt.hash("Password123!", 4),
    reputation: 100,
    isAdmin: false,
    ...overrides
  });
}

export async function createTestCommunity(user, overrides = {}) {
  const stamp = Date.now() + Math.floor(Math.random() * 100000);
  const community = await Community.create({
    name: `community${stamp}`,
    description: "Test community description",
    creator: user._id,
    members: [user._id],
    posts: [],
    ...overrides
  });

  await User.findByIdAndUpdate(user._id, {
    $addToSet: {
      createdCommunities: community._id,
      joinedCommunities: community._id
    }
  });

  return community;
}
