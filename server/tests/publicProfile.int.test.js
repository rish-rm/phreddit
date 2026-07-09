import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Post from "../models/Post.js";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  createTestCommunity,
  createTestUser,
  disconnectTestDb
} from "./testHelpers.js";

test("public profiles expose safe fields to guests and hide private data", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);
  await Post.create({
    title: "Public post",
    content: "Shown on the public profile.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const app = createApp({ useSessionStore: false });

  const response = await supertest(app).get(`/api/users/${user._id}/public`);
  assert.equal(response.status, 200);
  assert.equal(response.body.user.displayName, user.displayName);
  assert.equal(response.body.user.email, undefined);
  assert.equal(response.body.posts.length, 1);
  assert.equal(response.body.posts[0].title, "Public post");

  const missing = await supertest(app).get(
    "/api/users/64b000000000000000000000/public"
  );
  assert.equal(missing.status, 404);
});
