import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
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

test("post votes can be added, removed, and switched with correct reputation math", async (t) => {
  await connectTestDb();
  await clearTestDb();

  t.after(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  const author = await createTestUser({ reputation: 100 });
  const voter = await createTestUser({ reputation: 100 });
  const lowRepUser = await createTestUser({ reputation: 40 });
  const community = await createTestCommunity(author);
  const post = await Post.create({
    title: "Votable post",
    content: "Vote lifecycle test.",
    postedBy: author._id,
    community: community._id,
    comments: []
  });

  const app = createApp({ useSessionStore: false });
  const vote = (userId, voteType) =>
    supertest(app)
      .post(`/api/posts/${post._id}/vote`)
      .set("x-test-user-id", String(userId))
      .send({ voteType });

  // Add an upvote: +5 to the author.
  const upvoted = await vote(voter._id, "upvote");
  assert.equal(upvoted.status, 200);
  assert.equal(upvoted.body.post.upvotes, 1);
  assert.equal(upvoted.body.post.userVote, "upvote");
  assert.equal(upvoted.body.post.votedBy, undefined);
  assert.equal(upvoted.body.posterReputation, 105);

  // Same vote again removes it (toggle off): -5 back.
  const removed = await vote(voter._id, "upvote");
  assert.equal(removed.status, 200);
  assert.equal(removed.body.post.upvotes, 0);
  assert.equal(removed.body.post.userVote, null);
  assert.equal(removed.body.posterReputation, 100);

  // Downvote: -10.
  const downvoted = await vote(voter._id, "downvote");
  assert.equal(downvoted.status, 200);
  assert.equal(downvoted.body.post.downvotes, 1);
  assert.equal(downvoted.body.posterReputation, 90);

  // Switch downvote -> upvote: net +15 (remove -10, add +5).
  const switched = await vote(voter._id, "upvote");
  assert.equal(switched.status, 200);
  assert.equal(switched.body.post.upvotes, 1);
  assert.equal(switched.body.post.downvotes, 0);
  assert.equal(switched.body.post.userVote, "upvote");
  assert.equal(switched.body.posterReputation, 105);

  const storedPost = await Post.findById(post._id);
  assert.equal(storedPost.votedBy.length, 1);
  assert.equal(storedPost.votedBy[0].voteType, "upvote");

  // Authors cannot vote on their own posts.
  const selfVote = await vote(author._id, "upvote");
  assert.equal(selfVote.status, 400);

  // Reputation gate still applies.
  const gated = await vote(lowRepUser._id, "upvote");
  assert.equal(gated.status, 403);

  const finalAuthor = await User.findById(author._id);
  assert.equal(finalAuthor.reputation, 105);
});
