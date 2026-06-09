import { useState } from "react";
import { api } from "../api/client.js";
import { displayNameOfUser, formatDate, renderTextWithLinks } from "../utils/format.jsx";

export default function CommentItem({ comment, user, postId, depth = 0, setMessage, onReload }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  async function vote(voteType) {
    try {
      await api.voteComment(comment._id, voteType);
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
          <button onClick={() => vote("upvote")}>Upvote</button>
          <button onClick={() => vote("downvote")}>Downvote</button>
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
