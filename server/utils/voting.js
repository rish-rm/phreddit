export function canUserVote(user) {
  return Boolean(user && Number(user.reputation) >= 50);
}

export function voteTypeForUser(votedBy, userId) {
  if (!Array.isArray(votedBy) || !userId) return null;
  const vote = votedBy.find((item) => String(item.user) === String(userId));
  return vote?.voteType || null;
}

export function presentVotable(value, currentUserId = null) {
  const plain = typeof value?.toObject === "function"
    ? value.toObject({ virtuals: true })
    : { ...value };

  const { votedBy, ...safeValue } = plain;

  return {
    ...safeValue,
    userVote: voteTypeForUser(votedBy, currentUserId)
  };
}

export function hasUserAlreadyVoted(votedBy, userId) {
  return Boolean(voteTypeForUser(votedBy, userId));
}

export function reputationDeltaForVote(voteType) {
  if (voteType === "upvote") return 5;
  if (voteType === "downvote") return -10;
  throw new Error("Invalid vote type.");
}

export function resolveVoteChange(votedBy, userId, requestedVoteType) {
  const previousVote = voteTypeForUser(votedBy, userId);

  if (!previousVote) {
    return {
      previousVote,
      currentVote: requestedVoteType,
      upvoteDelta: requestedVoteType === "upvote" ? 1 : 0,
      downvoteDelta: requestedVoteType === "downvote" ? 1 : 0,
      reputationDelta: reputationDeltaForVote(requestedVoteType),
      action: "added"
    };
  }

  if (previousVote === requestedVoteType) {
    return {
      previousVote,
      currentVote: null,
      upvoteDelta: requestedVoteType === "upvote" ? -1 : 0,
      downvoteDelta: requestedVoteType === "downvote" ? -1 : 0,
      reputationDelta: -reputationDeltaForVote(requestedVoteType),
      action: "removed"
    };
  }

  return {
    previousVote,
    currentVote: requestedVoteType,
    upvoteDelta: requestedVoteType === "upvote" ? 1 : -1,
    downvoteDelta: requestedVoteType === "downvote" ? 1 : -1,
    reputationDelta: reputationDeltaForVote(requestedVoteType) - reputationDeltaForVote(previousVote),
    action: "switched"
  };
}

export function applyVoteChangeToDocument(document, userId, change) {
  document.upvotes = Math.max(0, Number(document.upvotes || 0) + change.upvoteDelta);
  document.downvotes = Math.max(0, Number(document.downvotes || 0) + change.downvoteDelta);

  if (!change.currentVote) {
    document.votedBy = document.votedBy.filter((vote) => String(vote.user) !== String(userId));
    return;
  }

  const existingVote = document.votedBy.find((vote) => String(vote.user) === String(userId));
  if (existingVote) {
    existingVote.voteType = change.currentVote;
    return;
  }

  document.votedBy.push({
    user: userId,
    voteType: change.currentVote
  });
}
