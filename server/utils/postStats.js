import Comment from "../models/Comment.js";

export function postIdOf(post) {
  return String(post?._id || post);
}

export async function buildPostStats(posts) {
  const ids = posts.map((post) => post._id).filter(Boolean);
  if (ids.length === 0) return new Map();

  const stats = await Comment.aggregate([
    {
      $match: {
        post: { $in: ids }
      }
    },
    {
      $group: {
        _id: "$post",
        commentCount: { $sum: 1 },
        latestCommentAt: { $max: "$createdAt" }
      }
    }
  ]);

  return new Map(
    stats.map((item) => [
      String(item._id),
      {
        commentCount: item.commentCount,
        latestCommentAt: item.latestCommentAt
      }
    ])
  );
}

export async function attachPostStats(posts) {
  const statsByPostId = await buildPostStats(posts);

  return posts.map((post) => {
    const plainPost = typeof post.toObject === "function"
      ? post.toObject({ virtuals: true })
      : post;
    const stats = statsByPostId.get(postIdOf(plainPost)) || {
      commentCount: 0,
      latestCommentAt: null
    };

    return {
      ...plainPost,
      commentCount: stats.commentCount,
      latestCommentAt: stats.latestCommentAt
    };
  });
}
