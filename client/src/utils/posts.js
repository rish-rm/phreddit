function countCommentTree(comments) {
  return comments.reduce((total, comment) => {
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    return total + 1 + countCommentTree(replies);
  }, 0);
}

export function commentCountOf(post) {
  const numericCount = Number(post.commentCount);
  if (Number.isFinite(numericCount)) {
    return numericCount;
  }

  return Array.isArray(post.comments) ? countCommentTree(post.comments) : 0;
}

export function isPostSavedByUser(user, postId) {
  if (!user || !postId) return false;
  return (user.savedPosts || []).some((savedPost) => (
    String(savedPost?._id || savedPost) === String(postId)
  ));
}

export function getJoinedCommunityIdSet(user) {
  const ids = (user?.joinedCommunities || [])
    .map((community) => String(community?._id || community))
    .filter(Boolean);
  return new Set(ids);
}

export function splitPostsByMembership(posts, user) {
  if (!user) {
    return { joinedPosts: [], otherPosts: posts };
  }
  const joinedIds = getJoinedCommunityIdSet(user);
  const joinedPosts = [];
  const otherPosts = [];
  for (const post of posts) {
    const communityId = String(post?.community?._id || post?.community || "");
    if (joinedIds.has(communityId)) {
      joinedPosts.push(post);
    } else {
      otherPosts.push(post);
    }
  }
  return { joinedPosts, otherPosts };
}

function scoreOf(comment) {
  return (comment.upvotes ?? 0) - (comment.downvotes ?? 0);
}

function createdTime(item) {
  const time = new Date(item.createdAt || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

// Recursively sorts a comment tree. mode: "newest" | "top".
export function sortComments(comments, mode = "newest") {
  const copy = (comments || []).map((comment) => ({
    ...comment,
    replies: sortComments(comment.replies || [], mode)
  }));

  if (mode === "top") {
    return copy.sort(
      (a, b) => scoreOf(b) - scoreOf(a) || createdTime(b) - createdTime(a)
    );
  }
  return copy.sort((a, b) => createdTime(b) - createdTime(a));
}
