import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  createTestCommunity,
  createTestUser,
  disconnectTestDb
} from "./testHelpers.js";

test("Create a Post creates a post document, adds it to the community, and returns success", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const app = createApp({ useSessionStore: false });

  const response = await supertest(app)
    .post("/api/posts")
    .set("x-test-user-id", String(user._id))
    .send({
      title: "Integration Test Post",
      content: "This post was created by an integration test.",
      community: String(community._id)
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Post created successfully.");
  assert.ok(response.body.post._id);

  const createdPost = await Post.findById(response.body.post._id);
  assert.ok(createdPost);
  assert.equal(createdPost.title, "Integration Test Post");

  const updatedCommunity = await Community.findById(community._id);
  assert.ok(
    updatedCommunity.posts.some((postId) => String(postId) === String(createdPost._id))
  );
});

test("Viewing a post is an explicit action and GET stays idempotent", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const post = await Post.create({
    title: "View Count Test Post",
    content: "This post is used to verify view-count semantics.",
    postedBy: user._id,
    community: community._id,
    comments: [],
    views: 0
  });

  const app = createApp({ useSessionStore: false });

  const getResponse = await supertest(app).get(`/api/posts/${post._id}`);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.post.views, 0);

  const viewResponse = await supertest(app).post(`/api/posts/${post._id}/view`);
  assert.equal(viewResponse.status, 200);
  assert.equal(viewResponse.body.views, 1);

  const refreshResponse = await supertest(app).get(`/api/posts/${post._id}`);
  assert.equal(refreshResponse.status, 200);
  assert.equal(refreshResponse.body.post.views, 1);
});

test("Create a Post rejects titles longer than 100 characters", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);
  const app = createApp({ useSessionStore: false });

  const response = await supertest(app)
    .post("/api/posts")
    .set("x-test-user-id", String(user._id))
    .send({
      title: "A".repeat(101),
      content: "This title should be rejected.",
      community: String(community._id)
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Post title must be 100 characters or less.");
  assert.equal(await Post.countDocuments({ community: community._id }), 0);
});

test("Update a Post rejects empty and oversized titles", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const post = await Post.create({
    title: "Original Title",
    content: "Original content.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const app = createApp({ useSessionStore: false });

  const emptyTitleResponse = await supertest(app)
    .put(`/api/posts/${post._id}`)
    .set("x-test-user-id", String(user._id))
    .send({ title: " " });

  assert.equal(emptyTitleResponse.status, 400);
  assert.equal(emptyTitleResponse.body.error, "Post title is required.");

  const oversizedTitleResponse = await supertest(app)
    .put(`/api/posts/${post._id}`)
    .set("x-test-user-id", String(user._id))
    .send({ title: "B".repeat(101) });

  assert.equal(oversizedTitleResponse.status, 400);
  assert.equal(
    oversizedTitleResponse.body.error,
    "Post title must be 100 characters or less."
  );

  const unchangedPost = await Post.findById(post._id);
  assert.equal(unchangedPost.title, "Original Title");
});

test("Get a Post returns bad request for an invalid post id", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const app = createApp({ useSessionStore: false });
  const response = await supertest(app).get("/api/posts/not-a-valid-id");

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid resource id.");
});

test("Create a Comment rejects object-shaped database ids", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);
  const post = await Post.create({
    title: "Safe comment target",
    content: "Object-shaped ids must never reach a database query.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });
  const app = createApp({ useSessionStore: false });

  const invalidPost = await supertest(app)
    .post("/api/comments")
    .set("x-test-user-id", String(user._id))
    .send({ post: { $ne: null }, content: "Invalid post id" });
  const invalidParent = await supertest(app)
    .post("/api/comments")
    .set("x-test-user-id", String(user._id))
    .send({
      post: String(post._id),
      parentComment: { $ne: null },
      content: "Invalid parent id"
    });

  assert.equal(invalidPost.status, 400);
  assert.equal(invalidParent.status, 400);
  assert.equal(await Comment.countDocuments({ post: post._id }), 0);
});

test("Create a Comment rejects replies attached to a different post", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const firstPost = await Post.create({
    title: "First Post",
    content: "First content.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const secondPost = await Post.create({
    title: "Second Post",
    content: "Second content.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const parentComment = await Comment.create({
    content: "Parent on first post",
    commentedBy: user._id,
    post: firstPost._id,
    parentComment: null,
    replies: []
  });

  const app = createApp({ useSessionStore: false });
  const response = await supertest(app)
    .post("/api/comments")
    .set("x-test-user-id", String(user._id))
    .send({
      post: String(secondPost._id),
      parentComment: String(parentComment._id),
      content: "This reply should not attach across posts."
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Parent comment does not belong to this post.");

  const replyCount = await Comment.countDocuments({
    parentComment: parentComment._id
  });
  assert.equal(replyCount, 0);
});

test("Get a Post populates nested comment replies", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const post = await Post.create({
    title: "Nested Reply Post",
    content: "Nested comments should render with author and content.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const rootComment = await Comment.create({
    content: "Root comment",
    commentedBy: user._id,
    post: post._id,
    parentComment: null,
    replies: []
  });

  const firstReply = await Comment.create({
    content: "First reply",
    commentedBy: user._id,
    post: post._id,
    parentComment: rootComment._id,
    replies: []
  });

  const secondReply = await Comment.create({
    content: "Nested reply",
    commentedBy: user._id,
    post: post._id,
    parentComment: firstReply._id,
    replies: []
  });

  rootComment.replies.push(firstReply._id);
  firstReply.replies.push(secondReply._id);
  post.comments.push(rootComment._id);

  await Promise.all([
    rootComment.save(),
    firstReply.save(),
    post.save()
  ]);

  const app = createApp({ useSessionStore: false });
  const response = await supertest(app).get(`/api/posts/${post._id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.post.comments[0].content, "Root comment");
  assert.equal(response.body.post.comments[0].replies[0].content, "First reply");
  assert.equal(
    response.body.post.comments[0].replies[0].replies[0].content,
    "Nested reply"
  );
  assert.equal(
    response.body.post.comments[0].replies[0].replies[0].commentedBy.displayName,
    user.displayName
  );
});
