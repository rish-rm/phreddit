import test from "node:test";
import assert from "node:assert/strict";
import {
  canUserVote,
  hasUserAlreadyVoted,
  reputationDeltaForVote
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

test("reputationDeltaForVote returns correct reputation changes", () => {
  assert.equal(reputationDeltaForVote("upvote"), 5);
  assert.equal(reputationDeltaForVote("downvote"), -10);
  assert.throws(() => reputationDeltaForVote("sideways"), /Invalid vote type/);
});
