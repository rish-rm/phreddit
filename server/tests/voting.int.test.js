import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import Comment from "../models/Comment.js";
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

test("post votes block self-votes and support add, remove, and switch", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const author = await createTestUser({ reputation: 100 });
  const voter = await createTestUser({ reputation: 100 });
  const community = await createTestCommunity(author);
  const post = await Post.create({
    title: "Vote mechanics",
    content: "Voting should be reversible.",
    postedBy: author._id,
    community: community._id,
    comments: []
  });

  const app = createApp({ useSessionStore: false });

  const selfVoteResponse = await supertest(app)
    .post(`/api/posts/${post._id}/vote`)
    .set("x-test-user-id", String(author._id))
    .send({ voteType: "upvote" });

  assert.equal(selfVoteResponse.status, 403);
  assert.equal(selfVoteResponse.body.error, "You cannot vote on your own post.");

  const upvoteResponse = await supertest(app)
    .post(`/api/posts/${post._id}/vote`)
    .set("x-test-user-id", String(voter._id))
    .send({ voteType: "upvote" });

  assert.equal(upvoteResponse.status, 200);
  assert.equal(upvoteResponse.body.message, "Vote recorded successfully.");
  assert.equal(upvoteResponse.body.currentVote, "upvote");

  let updatedPost = await Post.findById(post._id);
  let updatedAuthor = await User.findById(author._id);
  assert.equal(updatedPost.upvotes, 1);
  assert.equal(updatedPost.downvotes, 0);
  assert.equal(updatedPost.votedBy.length, 1);
  assert.equal(updatedAuthor.reputation, 105);

  const removeResponse = await supertest(app)
    .post(`/api/posts/${post._id}/vote`)
    .set("x-test-user-id", String(voter._id))
    .send({ voteType: "upvote" });

  assert.equal(removeResponse.status, 200);
  assert.equal(removeResponse.body.message, "Vote removed successfully.");
  assert.equal(removeResponse.body.currentVote, null);

  updatedPost = await Post.findById(post._id);
  updatedAuthor = await User.findById(author._id);
  assert.equal(updatedPost.upvotes, 0);
  assert.equal(updatedPost.downvotes, 0);
  assert.equal(updatedPost.votedBy.length, 0);
  assert.equal(updatedAuthor.reputation, 100);

  const downvoteResponse = await supertest(app)
    .post(`/api/posts/${post._id}/vote`)
    .set("x-test-user-id", String(voter._id))
    .send({ voteType: "downvote" });

  assert.equal(downvoteResponse.status, 200);
  assert.equal(downvoteResponse.body.currentVote, "downvote");

  updatedAuthor = await User.findById(author._id);
  assert.equal(updatedAuthor.reputation, 90);

  const switchResponse = await supertest(app)
    .post(`/api/posts/${post._id}/vote`)
    .set("x-test-user-id", String(voter._id))
    .send({ voteType: "upvote" });

  assert.equal(switchResponse.status, 200);
  assert.equal(switchResponse.body.message, "Vote switched successfully.");
  assert.equal(switchResponse.body.currentVote, "upvote");

  updatedPost = await Post.findById(post._id);
  updatedAuthor = await User.findById(author._id);
  assert.equal(updatedPost.upvotes, 1);
  assert.equal(updatedPost.downvotes, 0);
  assert.equal(updatedPost.votedBy.length, 1);
  assert.equal(updatedPost.votedBy[0].voteType, "upvote");
  assert.equal(updatedAuthor.reputation, 105);
});

test("comment votes block self-votes and expose current vote on post detail", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const author = await createTestUser({ reputation: 100 });
  const commenter = await createTestUser({ reputation: 100 });
  const voter = await createTestUser({ reputation: 100 });
  const community = await createTestCommunity(author);
  const post = await Post.create({
    title: "Comment vote mechanics",
    content: "Comments should report current vote state.",
    postedBy: author._id,
    community: community._id,
    comments: []
  });
  const comment = await Comment.create({
    content: "Vote on this comment",
    commentedBy: commenter._id,
    post: post._id,
    parentComment: null,
    replies: []
  });
  post.comments.push(comment._id);
  await post.save();

  const app = createApp({ useSessionStore: false });

  const selfVoteResponse = await supertest(app)
    .post(`/api/comments/${comment._id}/vote`)
    .set("x-test-user-id", String(commenter._id))
    .send({ voteType: "downvote" });

  assert.equal(selfVoteResponse.status, 403);
  assert.equal(selfVoteResponse.body.error, "You cannot vote on your own comment.");

  const upvoteResponse = await supertest(app)
    .post(`/api/comments/${comment._id}/vote`)
    .set("x-test-user-id", String(voter._id))
    .send({ voteType: "upvote" });

  assert.equal(upvoteResponse.status, 200);
  assert.equal(upvoteResponse.body.currentVote, "upvote");

  const postDetailResponse = await supertest(app)
    .get(`/api/posts/${post._id}?incrementView=false`)
    .set("x-test-user-id", String(voter._id));

  assert.equal(postDetailResponse.status, 200);
  assert.equal(postDetailResponse.body.post.userVote, null);
  assert.equal(postDetailResponse.body.post.comments[0].userVote, "upvote");

  const updatedCommenter = await User.findById(commenter._id);
  assert.equal(updatedCommenter.reputation, 105);
});
