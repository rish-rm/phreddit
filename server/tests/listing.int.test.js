import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  createTestCommunity,
  createTestUser,
  disconnectTestDb
} from "./testHelpers.js";

test("post listings paginate, sort server-side, and search via text indexes", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);
  const app = createApp({ useSessionStore: false });

  await Post.create({
    title: "Alpha zebra thread",
    content: "First created post.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });
  await Post.create({
    title: "Beta thread",
    content: "Second created post mentioning giraffes.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });
  const third = await Post.create({
    title: "Gamma thread",
    content: "Third created post.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  await Comment.create({
    content: "A comment about zebra migration.",
    commentedBy: user._id,
    post: third._id,
    parentComment: null,
    replies: []
  });

  // Pagination: newest-first, two pages.
  const pageOne = await supertest(app).get("/api/posts").query({ limit: 2, page: 1 });
  assert.equal(pageOne.status, 200);
  assert.equal(pageOne.body.posts.length, 2);
  assert.equal(pageOne.body.total, 3);
  assert.equal(pageOne.body.hasMore, true);
  assert.deepEqual(
    pageOne.body.posts.map((post) => post.title),
    ["Gamma thread", "Beta thread"]
  );

  const pageTwo = await supertest(app).get("/api/posts").query({ limit: 2, page: 2 });
  assert.equal(pageTwo.body.posts.length, 1);
  assert.equal(pageTwo.body.hasMore, false);
  assert.equal(pageTwo.body.posts[0].title, "Alpha zebra thread");

  // Oldest sort.
  const oldest = await supertest(app).get("/api/posts").query({ sort: "oldest", limit: 10 });
  assert.equal(oldest.body.posts[0].title, "Alpha zebra thread");

  // Active sort: the commented post ranks first, quiet posts newest-first after.
  const active = await supertest(app).get("/api/posts").query({ sort: "active", limit: 10 });
  assert.deepEqual(
    active.body.posts.map((post) => post.title),
    ["Gamma thread", "Beta thread", "Alpha zebra thread"]
  );
  assert.equal(active.body.posts[0].commentCount, 1);

  // Search matches post titles/content and comment content via text indexes.
  const zebraSearch = await supertest(app).get("/api/posts").query({ search: "zebra" });
  assert.deepEqual(
    zebraSearch.body.posts.map((post) => post.title).sort(),
    ["Alpha zebra thread", "Gamma thread"]
  );

  const giraffeSearch = await supertest(app).get("/api/posts").query({ search: "giraffes" });
  assert.deepEqual(
    giraffeSearch.body.posts.map((post) => post.title),
    ["Beta thread"]
  );

  const noResults = await supertest(app).get("/api/posts").query({ search: "nonexistentterm" });
  assert.equal(noResults.body.posts.length, 0);
  assert.equal(noResults.body.total, 0);

});
