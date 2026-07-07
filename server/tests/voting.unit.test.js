import test from "node:test";
import assert from "node:assert/strict";
import {
  applyVoteChangeToDocument,
  canUserVote,
  hasUserAlreadyVoted,
  reputationDeltaForVote,
  resolveVoteChange,
  voteTypeForUser
} from "../utils/voting.js";

test("canUserVote requires reputation of at least 50", () => {
  assert.equal(canUserVote({ reputation: 50 }), true);
  assert.equal(canUserVote({ reputation: 49 }), false);
  assert.equal(canUserVote(null), false);
});

test("hasUserAlreadyVoted detects votes by string-equivalent ids", () => {
  assert.equal(hasUserAlreadyVoted([{ user: "abc", voteType: "upvote" }], "abc"), true);
  assert.equal(hasUserAlreadyVoted([{ user: "abc", voteType: "upvote" }], "xyz"), false);
});

test("voteTypeForUser returns the current user's vote type", () => {
  assert.equal(voteTypeForUser([{ user: "abc", voteType: "downvote" }], "abc"), "downvote");
  assert.equal(voteTypeForUser([{ user: "abc", voteType: "downvote" }], "xyz"), null);
});

test("reputationDeltaForVote returns correct reputation changes", () => {
  assert.equal(reputationDeltaForVote("upvote"), 5);
  assert.equal(reputationDeltaForVote("downvote"), -10);
  assert.throws(() => reputationDeltaForVote("sideways"), /Invalid vote type/);
});

test("resolveVoteChange adds, removes, and switches votes with reputation deltas", () => {
  assert.deepEqual(resolveVoteChange([], "u1", "upvote"), {
    previousVote: null,
    currentVote: "upvote",
    upvoteDelta: 1,
    downvoteDelta: 0,
    reputationDelta: 5,
    action: "added"
  });

  assert.deepEqual(resolveVoteChange([{ user: "u1", voteType: "upvote" }], "u1", "upvote"), {
    previousVote: "upvote",
    currentVote: null,
    upvoteDelta: -1,
    downvoteDelta: 0,
    reputationDelta: -5,
    action: "removed"
  });

  assert.deepEqual(resolveVoteChange([{ user: "u1", voteType: "downvote" }], "u1", "upvote"), {
    previousVote: "downvote",
    currentVote: "upvote",
    upvoteDelta: 1,
    downvoteDelta: -1,
    reputationDelta: 15,
    action: "switched"
  });
});

test("applyVoteChangeToDocument mutates vote counters and votedBy consistently", () => {
  const document = {
    upvotes: 0,
    downvotes: 1,
    votedBy: [{ user: "u1", voteType: "downvote" }]
  };

  applyVoteChangeToDocument(document, "u1", resolveVoteChange(document.votedBy, "u1", "upvote"));

  assert.equal(document.upvotes, 1);
  assert.equal(document.downvotes, 0);
  assert.deepEqual(document.votedBy, [{ user: "u1", voteType: "upvote" }]);

  applyVoteChangeToDocument(document, "u1", resolveVoteChange(document.votedBy, "u1", "upvote"));

  assert.equal(document.upvotes, 0);
  assert.equal(document.downvotes, 0);
  assert.deepEqual(document.votedBy, []);
});
