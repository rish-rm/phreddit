import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { createApp } from "../server.js";
import {
  clearTestDb,
  connectTestDb,
  createTestCommunity,
  createTestUser,
  disconnectTestDb
} from "./testHelpers.js";

test("Delete a Post removes the post, removes attached comments, and returns success", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const user = await createTestUser();
  const community = await createTestCommunity(user);

  const post = await Post.create({
    title: "Post To Delete",
    content: "Delete me.",
    postedBy: user._id,
    community: community._id,
    comments: []
  });

  const comment = await Comment.create({
    content: "Attached comment",
    commentedBy: user._id,
    post: post._id,
    parentComment: null,
    replies: []
  });

  post.comments.push(comment._id);
  await post.save();

  await Community.findByIdAndUpdate(community._id, {
    $addToSet: {
      posts: post._id
    }
  });

  await User.findByIdAndUpdate(user._id, {
    $addToSet: {
      createdPosts: post._id,
      createdComments: comment._id
    }
  });

  assert.ok(await Post.findById(post._id));
  assert.ok(await Comment.findById(comment._id));

  const app = createApp({ useSessionStore: false });

  const response = await supertest(app)
    .delete(`/api/posts/${post._id}`)
    .set("x-test-user-id", String(user._id));

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Post deleted successfully.");
  assert.equal(await Post.findById(post._id), null);
  assert.equal(await Comment.findById(comment._id), null);

  const updatedCommunity = await Community.findById(community._id);
  assert.equal(
    updatedCommunity.posts.some((postId) => String(postId) === String(post._id)),
    false
  );
});
