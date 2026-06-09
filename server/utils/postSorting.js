function newestFirst(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function oldestFirst(a, b) {
  return new Date(a.createdAt) - new Date(b.createdAt);
}

function latestActivityTime(post) {
  const commentDates = (post.comments || [])
    .map((comment) => new Date(comment.createdAt || comment).getTime())
    .filter((time) => Number.isFinite(time));

  return Math.max(new Date(post.createdAt).getTime(), ...commentDates);
}

export function sortPosts(posts, order = "newest") {
  const copy = [...posts];

  if (order === "oldest") {
    return copy.sort(oldestFirst);
  }

  if (order === "active") {
    return copy.sort((a, b) => latestActivityTime(b) - latestActivityTime(a));
  }

  return copy.sort(newestFirst);
}

export function groupPostsByMembership(posts, user, order = "newest") {
  if (!user) {
    return sortPosts(posts, order);
  }

  const joinedIds = new Set((user.joinedCommunities || []).map((id) => String(id)));
  const joined = [];
  const other = [];

  for (const post of posts) {
    const communityId = String(post.community?._id || post.community);
    if (joinedIds.has(communityId)) {
      joined.push(post);
    } else {
      other.push(post);
    }
  }

  return {
    joined: sortPosts(joined, order),
    other: sortPosts(other, order)
  };
}
