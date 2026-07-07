import { presentVotable } from "./voting.js";

function sortByCreatedAtDescending(items) {
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const item of items) {
    sortByCreatedAtDescending(item.replies);
  }
  return items;
}

export function buildCommentTree(comments, currentUserId = null) {
  const commentsById = new Map();
  const roots = [];

  for (const comment of comments) {
    const safeComment = {
      ...presentVotable(comment, currentUserId),
      replies: []
    };
    commentsById.set(String(safeComment._id), safeComment);
  }

  for (const comment of commentsById.values()) {
    const parentId = comment.parentComment ? String(comment.parentComment) : null;
    const parent = parentId ? commentsById.get(parentId) : null;

    if (parent) {
      parent.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return sortByCreatedAtDescending(roots);
}
