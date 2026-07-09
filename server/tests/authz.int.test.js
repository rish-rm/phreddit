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

test("authorization rules reject guests, non-owners, and non-admins", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const owner = await createTestUser();
  const otherUser = await createTestUser();
  const community = await createTestCommunity(owner);
  const post = await Post.create({
    title: "Owned post",
    content: "Only the owner or an admin may modify this.",
    postedBy: owner._id,
    community: community._id,
    comments: []
  });

  const app = createApp({ useSessionStore: false });

  const guestCreate = await supertest(app).post("/api/posts").send({
    title: "Guest post",
    content: "Guests cannot post.",
    community: String(community._id)
  });
  assert.equal(guestCreate.status, 401);

  const nonOwnerEdit = await supertest(app)
    .put(`/api/posts/${post._id}`)
    .set("x-test-user-id", String(otherUser._id))
    .send({ title: "Hijacked title" });
  assert.equal(nonOwnerEdit.status, 403);

  const nonOwnerDelete = await supertest(app)
    .delete(`/api/posts/${post._id}`)
    .set("x-test-user-id", String(otherUser._id));
  assert.equal(nonOwnerDelete.status, 403);

  const nonAdminReports = await supertest(app)
    .get("/api/reports")
    .set("x-test-user-id", String(otherUser._id));
  assert.equal(nonAdminReports.status, 403);

  const nonAdminUserList = await supertest(app)
    .get("/api/users")
    .set("x-test-user-id", String(otherUser._id));
  assert.equal(nonAdminUserList.status, 403);

  const untouched = await Post.findById(post._id);
  assert.equal(untouched.title, "Owned post");
});
