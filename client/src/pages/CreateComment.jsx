import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";

export default function CreateComment() {
  const { user, showMessage, refreshData } = useOutletContext();
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const parentComment = searchParams.get("parent") || null;
  const [postTitle, setPostTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getPost(postId)
      .then((data) => setPostTitle(data.post?.title || "Post"))
      .catch((error) => showMessage(error.message, "error"));
  }, [postId, showMessage]);

  async function submit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    try {
      setSubmitting(true);
      await api.createComment({
        post: postId,
        content: content.trim(),
        ...(parentComment ? { parentComment } : {})
      });
      refreshData();
      showMessage(parentComment ? "Reply added successfully." : "Comment added successfully.", "success");
      navigate(`/posts/${postId}`);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="card">
        <h1>New Comment</h1>
        <p>You must be logged in to comment.</p>
        <Link className="inline-link" to={`/posts/${postId}`}>Return to post</Link>
      </main>
    );
  }

  return (
    <main className="card" aria-label="New Comment Page">
      <p className="eyebrow">{parentComment ? "Replying in" : "Commenting on"}</p>
      <h1>New Comment</h1>
      <p className="page-subtitle">{postTitle || "Loading post..."}</p>
      <form onSubmit={submit}>
        <label htmlFor="commentContent">Comment* (max 500 characters)</label>
        <textarea
          id="commentContent"
          autoFocus
          required
          maxLength={500}
          placeholder={parentComment ? "Write your reply" : "Share your response"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <p className="field-hint">{content.length}/500</p>
        <div className="action-row">
          <button type="submit" disabled={submitting || !content.trim()}>
            {submitting ? "Submitting..." : "Submit Comment"}
          </button>
          <button type="button" onClick={() => navigate(`/posts/${postId}`)}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
