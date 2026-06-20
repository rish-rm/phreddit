export function latestActivityTime(post) {
  const latestCommentAt = new Date(post.latestCommentAt || 0).getTime();
  if (Number.isFinite(latestCommentAt) && latestCommentAt > 0) {
    return latestCommentAt;
  }

  return latestCommentTime(post.comments || []);
}

function createdTime(post) {
  const time = new Date(post.createdAt || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function latestCommentTime(comments) {
  let latest = 0;

  for (const comment of comments) {
    const createdAt = new Date(comment.createdAt || 0).getTime();
    if (Number.isFinite(createdAt)) {
      latest = Math.max(latest, createdAt);
    }
    if (Array.isArray(comment.replies)) {
      latest = Math.max(latest, latestCommentTime(comment.replies));
    }
  }

  return latest;
}

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

function hasCommentActivity(post) {
  return commentCountOf(post) > 0;
}

export function sortPostsClient(posts, order) {
  const copy = [...posts];
  if (order === "oldest") {
    return copy.sort((a, b) => createdTime(a) - createdTime(b));
  }
  if (order === "active") {
    return copy.sort((a, b) => {
      const aHasComments = hasCommentActivity(a);
      const bHasComments = hasCommentActivity(b);

      if (aHasComments !== bHasComments) {
        return aHasComments ? -1 : 1;
      }

      if (aHasComments && bHasComments) {
        return latestActivityTime(b) - latestActivityTime(a);
      }

      return createdTime(b) - createdTime(a);
    });
  }
  return copy.sort((a, b) => createdTime(b) - createdTime(a));
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
