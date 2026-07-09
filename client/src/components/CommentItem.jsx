import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { displayNameOfUser, formatDate, userIdOf } from "../utils/format.jsx";
import RichText from "./RichText.jsx";

export default function CommentItem({ comment, user, postId, depth = 0, showMessage, onReload }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const canVote = Boolean(user) && (user.reputation ?? 0) >= 50;
  const isOwnComment =
    user && String(userIdOf(comment.commentedBy)) === String(user._id);
  const voteHint = !canVote
    ? "Voting requires a reputation of at least 50."
    : isOwnComment
      ? "You cannot vote on your own comment."
      : undefined;
  const authorId = userIdOf(comment.commentedBy);

  async function vote(voteType) {
    try {
      const data = await api.voteComment(comment._id, voteType);
      showMessage(data.message, "success");
      await onReload();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function submitReply(event) {
    event.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.createComment({
        post: postId,
        parentComment: comment._id,
        content: replyText
      });
      setReplyText("");
      setShowReply(false);
      await onReload();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  const replies = Array.isArray(comment.replies) ? comment.replies : [];

  return (
    <div className="comment-card" style={{ marginLeft: depth * 24 }}>
      <div className="meta-row">
        {authorId ? (
          <Link className="inline-link" to={`/users/${authorId}`}>
            <strong>{displayNameOfUser(comment.commentedBy)}</strong>
          </Link>
        ) : (
          <strong>{displayNameOfUser(comment.commentedBy)}</strong>
        )}
        <span>{formatDate(comment.createdAt)}</span>
      </div>
      <RichText text={comment.content} />
      {user && (
        <div className="action-row">
          <button
            type="button"
            aria-label="Upvote"
            aria-pressed={comment.userVote === "upvote"}
            className={comment.userVote === "upvote" ? "vote-btn active" : "vote-btn"}
            disabled={!canVote || isOwnComment}
            title={voteHint}
            onClick={() => vote("upvote")}
          >
            ▲ {comment.upvotes ?? 0}
          </button>
          <button
            type="button"
            aria-label="Downvote"
            aria-pressed={comment.userVote === "downvote"}
            className={comment.userVote === "downvote" ? "vote-btn active" : "vote-btn"}
            disabled={!canVote || isOwnComment}
            title={voteHint}
            onClick={() => vote("downvote")}
          >
            ▼ {comment.downvotes ?? 0}
          </button>
          <button onClick={() => setShowReply((value) => !value)}>
            {showReply ? "Cancel" : "Reply"}
          </button>
        </div>
      )}
      {!user && (
        <div className="meta-row">
          <span>Up: {comment.upvotes ?? 0}</span>
          <span>Down: {comment.downvotes ?? 0}</span>
        </div>
      )}
      {showReply && (
        <form onSubmit={submitReply}>
          <textarea
            placeholder="Write a reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
          <button type="submit">Submit reply</button>
        </form>
      )}
      {replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          user={user}
          postId={postId}
          depth={depth + 1}
          showMessage={showMessage}
          onReload={onReload}
        />
      ))}
    </div>
  );
}
