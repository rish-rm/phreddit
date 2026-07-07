import { useState } from "react";
import { api } from "../api/client.js";
import { displayNameOfUser, formatDate, renderTextWithLinks } from "../utils/format.jsx";
import { voteButtonLabel, votingDisabledReason } from "../utils/voting.js";

export default function CommentItem({ comment, user, postId, depth = 0, setMessage, onReload }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  async function vote(voteType) {
    try {
      const data = await api.voteComment(comment._id, voteType);
      setMessage(data.message);
      await onReload();
    } catch (error) {
      setMessage(error.message);
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
      setMessage(error.message);
    }
  }

  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const sortedReplies = [...replies].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const voteDisabledReason = votingDisabledReason(user, comment.commentedBy, "comment");

  return (
    <div className="comment-card" style={{ marginLeft: depth * 24 }}>
      <div className="meta-row">
        <strong>{displayNameOfUser(comment.commentedBy)}</strong>
        <span>{formatDate(comment.createdAt)}</span>
        <span>Up: {comment.upvotes ?? 0}</span>
        <span>Down: {comment.downvotes ?? 0}</span>
      </div>
      <div>{renderTextWithLinks(comment.content)}</div>
      {user && (
        <div className="action-row">
          <button
            className={comment.userVote === "upvote" ? "active" : ""}
            disabled={Boolean(voteDisabledReason)}
            title={voteDisabledReason || "Click again to remove your vote."}
            onClick={() => vote("upvote")}
          >
            {voteButtonLabel("upvote", comment.userVote, comment.upvotes)}
          </button>
          <button
            className={comment.userVote === "downvote" ? "active" : ""}
            disabled={Boolean(voteDisabledReason)}
            title={voteDisabledReason || "Click again to remove your vote."}
            onClick={() => vote("downvote")}
          >
            {voteButtonLabel("downvote", comment.userVote, comment.downvotes)}
          </button>
          <button onClick={() => setShowReply((v) => !v)}>
            {showReply ? "Cancel" : "Reply"}
          </button>
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
      {sortedReplies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          user={user}
          postId={postId}
          depth={depth + 1}
          setMessage={setMessage}
          onReload={onReload}
        />
      ))}
    </div>
  );
}
