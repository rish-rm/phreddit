import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Comment from "../models/Comment.js";
import LinkFlair from "../models/LinkFlair.js";
import Post from "../models/Post.js";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  createTestCommunity,
  createTestUser,
  disconnectTestDb
} from "./testHelpers.js";

test("Post listings include total comment count, latest comment time, and flair filtering", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);
  const matchingFlair = await LinkFlair.create({ content: "Question" });
  const otherFlair = await LinkFlair.create({ content: "Guide" });

  const activePost = await Post.create({
    title: "Active thread",
    content: "This post has comments.",
    postedBy: user._id,
    community: community._id,
    linkFlair: matchingFlair._id,
    comments: []
  });

  const quietPost = await Post.create({
    title: "Quiet thread",
    content: "This post has no comments.",
    postedBy: user._id,
    community: community._id,
    linkFlair: otherFlair._id,
    comments: []
  });

  const rootComment = await Comment.create({
    content: "Root comment",
    commentedBy: user._id,
    post: activePost._id,
    parentComment: null,
    replies: []
  });

  const reply = await Comment.create({
    content: "Reply comment",
    commentedBy: user._id,
    post: activePost._id,
    parentComment: rootComment._id,
    replies: []
  });

  rootComment.replies.push(reply._id);
  activePost.comments.push(rootComment._id);

  const olderDate = new Date("2025-04-09T12:00:00.000Z");
  const latestDate = new Date("2025-04-10T12:00:00.000Z");
  await Promise.all([
    rootComment.save(),
    activePost.save()
  ]);
  await Promise.all([
    Comment.collection.updateOne({ _id: rootComment._id }, { $set: { createdAt: olderDate } }),
    Comment.collection.updateOne({ _id: reply._id }, { $set: { createdAt: latestDate } })
  ]);

  const app = createApp({ useSessionStore: false });
  const allResponse = await supertest(app).get("/api/posts");

  assert.equal(allResponse.status, 200);
  const activeFromListing = allResponse.body.posts.find(
    (post) => String(post._id) === String(activePost._id)
  );
  const quietFromListing = allResponse.body.posts.find(
    (post) => String(post._id) === String(quietPost._id)
  );

  assert.equal(activeFromListing.commentCount, 2);
  assert.equal(new Date(activeFromListing.latestCommentAt).toISOString(), latestDate.toISOString());
  assert.equal(quietFromListing.commentCount, 0);
  assert.equal(quietFromListing.latestCommentAt, null);

  const filteredResponse = await supertest(app)
    .get("/api/posts")
    .query({ linkFlair: String(matchingFlair._id) });

  assert.equal(filteredResponse.status, 200);
  assert.deepEqual(
    filteredResponse.body.posts.map((post) => post.title),
    ["Active thread"]
  );
});

test("Deleting a user removes their votes and corrects vote totals", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const admin = await createTestUser({ isAdmin: true, displayName: "adminUser", email: "admin@example.com" });
  const author = await createTestUser();
  const voter = await createTestUser();
  const community = await createTestCommunity(author);
  const post = await Post.create({
    title: "Voted post",
    content: "This post received a vote.",
    postedBy: author._id,
    community: community._id,
    comments: [],
    upvotes: 1,
    downvotes: 0,
    votedBy: [{ user: voter._id, voteType: "upvote" }]
  });

  const comment = await Comment.create({
    content: "Voted comment",
    commentedBy: author._id,
    post: post._id,
    parentComment: null,
    replies: [],
    upvotes: 0,
    downvotes: 1,
    votedBy: [{ user: voter._id, voteType: "downvote" }]
  });

  post.comments.push(comment._id);
  await post.save();

  const app = createApp({ useSessionStore: false });
  const response = await supertest(app)
    .delete(`/api/users/${voter._id}`)
    .set("x-test-user-id", String(admin._id));

  assert.equal(response.status, 200);

  const updatedPost = await Post.findById(post._id);
  const updatedComment = await Comment.findById(comment._id);

  assert.equal(updatedPost.upvotes, 0);
  assert.equal(updatedPost.votedBy.length, 0);
  assert.equal(updatedComment.downvotes, 0);
  assert.equal(updatedComment.votedBy.length, 0);
});
