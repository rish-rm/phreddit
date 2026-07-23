import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { emitPostUpdated } from "../realtime.js";

export async function deleteCommentAndReplies(commentId, { emit = true } = {}) {
  const comment = await Comment.findById(commentId);
  if (!comment) return;

  for (const replyId of comment.replies) {
    await deleteCommentAndReplies(replyId, { emit: false });
  }

  await Comment.updateMany(
    { replies: comment._id },
    { $pull: { replies: comment._id } }
  );

  await Post.updateMany(
    { comments: comment._id },
    { $pull: { comments: comment._id } }
  );

  await User.updateMany(
    { createdComments: comment._id },
    { $pull: { createdComments: comment._id } }
  );

  await Comment.findByIdAndDelete(comment._id);
  if (emit) emitPostUpdated(comment.post);
}

export async function deletePostAndComments(postId, { deleteReports = true } = {}) {
  const post = await Post.findById(postId);
  if (!post) return;

  for (const commentId of post.comments) {
    await deleteCommentAndReplies(commentId, { emit: false });
  }

  await Community.updateMany(
    { posts: post._id },
    { $pull: { posts: post._id } }
  );

  await User.updateMany(
    { createdPosts: post._id },
    { $pull: { createdPosts: post._id } }
  );

  await User.updateMany(
    { savedPosts: post._id },
    { $pull: { savedPosts: post._id } }
  );

  if (deleteReports) {
    await Report.deleteMany({ targetPost: post._id });
  }

  await Post.findByIdAndDelete(post._id);
  emitPostUpdated(post._id);
}

async function reverseVotesByUser(userId) {
  const [posts, comments] = await Promise.all([
    Post.find({ "votedBy.user": userId }).select("postedBy votedBy"),
    Comment.find({ "votedBy.user": userId }).select("commentedBy votedBy")
  ]);
  const reputationByAuthor = new Map();

  function collect(authorId, votedBy) {
    const vote = votedBy.find((item) => String(item.user) === String(userId));
    if (!vote) return;
    const key = String(authorId);
    const reversal = vote.voteType === "upvote" ? -5 : 10;
    reputationByAuthor.set(key, (reputationByAuthor.get(key) || 0) + reversal);
  }

  posts.forEach((post) => collect(post.postedBy, post.votedBy));
  comments.forEach((comment) => collect(comment.commentedBy, comment.votedBy));

  if (reputationByAuthor.size > 0) {
    await User.bulkWrite(
      [...reputationByAuthor].map(([authorId, reputation]) => ({
        updateOne: {
          filter: { _id: authorId },
          update: { $inc: { reputation } }
        }
      }))
    );
  }
}

export async function deleteCommunityCascade(communityId) {
  const community = await Community.findById(communityId);
  if (!community) return;

  const posts = await Post.find({ community: community._id });
  for (const post of posts) {
    await deletePostAndComments(post._id);
  }

  await User.updateMany(
    {
      $or: [
        { joinedCommunities: community._id },
        { createdCommunities: community._id }
      ]
    },
    {
      $pull: {
        joinedCommunities: community._id,
        createdCommunities: community._id
      }
    }
  );

  await Community.findByIdAndDelete(community._id);
}

export async function deleteUserCascade(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  await reverseVotesByUser(user._id);

  const createdCommunities = await Community.find({ creator: user._id });
  for (const community of createdCommunities) {
    await deleteCommunityCascade(community._id);
  }

  const createdPosts = await Post.find({ postedBy: user._id });
  for (const post of createdPosts) {
    await deletePostAndComments(post._id);
  }

  const createdComments = await Comment.find({ commentedBy: user._id });
  for (const comment of createdComments) {
    await deleteCommentAndReplies(comment._id);
  }

  await Community.updateMany(
    { members: user._id },
    { $pull: { members: user._id } }
  );

  await Post.updateMany(
    { votedBy: { $elemMatch: { user: user._id, voteType: "upvote" } } },
    { $inc: { upvotes: -1 } }
  );

  await Post.updateMany(
    { votedBy: { $elemMatch: { user: user._id, voteType: "downvote" } } },
    { $inc: { downvotes: -1 } }
  );

  await Post.updateMany(
    { "votedBy.user": user._id },
    { $pull: { votedBy: { user: user._id } } }
  );

  await Comment.updateMany(
    { votedBy: { $elemMatch: { user: user._id, voteType: "upvote" } } },
    { $inc: { upvotes: -1 } }
  );

  await Comment.updateMany(
    { votedBy: { $elemMatch: { user: user._id, voteType: "downvote" } } },
    { $inc: { downvotes: -1 } }
  );

  await Comment.updateMany(
    { "votedBy.user": user._id },
    { $pull: { votedBy: { user: user._id } } }
  );

  await Report.deleteMany({ reportedBy: user._id });

  await User.findByIdAndDelete(user._id);
}
