export function idOf(value) {
  return value?._id || value || "";
}

export function votingDisabledReason(user, owner, contentLabel) {
  if (!user) return "Login to vote.";
  if (Number(user.reputation || 0) < 50) {
    return "Users with reputation below 50 cannot vote.";
  }
  if (String(idOf(owner)) === String(user._id)) {
    return `You cannot vote on your own ${contentLabel}.`;
  }
  return "";
}

export function voteButtonLabel(voteType, currentVote, count) {
  const isSelected = currentVote === voteType;
  const verb = voteType === "upvote" ? "Upvote" : "Downvote";
  const selectedVerb = voteType === "upvote" ? "Upvoted" : "Downvoted";
  return `${isSelected ? selectedVerb : verb} (${count ?? 0})`;
}
