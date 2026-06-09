export function latestActivityTime(post) {
  const commentDates = (post.comments || [])
    .map((comment) => new Date(comment.createdAt || comment).getTime())
    .filter(Number.isFinite);
  return Math.max(new Date(post.createdAt).getTime(), ...commentDates);
}

export function sortPostsClient(posts, order) {
  const copy = [...posts];
  if (order === "oldest") {
    return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  if (order === "active") {
    return copy.sort((a, b) => latestActivityTime(b) - latestActivityTime(a));
  }
  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
