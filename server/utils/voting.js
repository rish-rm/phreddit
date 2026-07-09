export function canUserVote(user) {
  return Boolean(user && Number(user.reputation) >= 50);
}

export function hasUserAlreadyVoted(votedBy, userId) {
  if (!Array.isArray(votedBy) || !userId) return false;
  return votedBy.some((vote) => String(vote.user) === String(userId));
}

export function reputationDeltaForVote(voteType) {
  if (voteType === "upvote") return 5;
  if (voteType === "downvote") return -10;
  throw new Error("Invalid vote type.");
}
