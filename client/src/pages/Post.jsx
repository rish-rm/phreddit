import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import CommentItem from "../components/CommentItem.jsx";
import SavePostButton from "../components/SavePostButton.jsx";
import { displayNameOfUser, flairContentOf, renderTextWithLinks } from "../utils/format.jsx";
import { commentCountOf } from "../utils/posts.js";

export default function Post({ user, postId, setView, setMessage, onSuccess, onUserRefresh }) {
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    reason: "spam",
    details: ""
  });

  const loadPost = useCallback(async ({ incrementView = false } = {}) => {
    if (!postId) return;
    try {
      const data = await api.getPost(postId, { incrementView });
      setPost(data.post);
    } catch (error) {
      setMessage(error.message);
    }
  }, [postId, setMessage]);

  useEffect(() => {
    loadPost({ incrementView: true });
  }, [loadPost]);

  async function votePost(voteType) {
    try {
      await api.votePost(postId, voteType);
      onSuccess();
      await loadPost();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    try {
      await api.createComment({
        post: postId,
        content: commentText
      });
      setCommentText("");
      onSuccess();
      await loadPost();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    try {
      const data = await api.reportPost(postId, reportForm);
      setMessage(data.message);
      setShowReportForm(false);
      setReportForm({ reason: "spam", details: "" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!post) {
    return (
      <main className="card">
        <h1>Post</h1>
        <p>Loading post...</p>
      </main>
    );
  }

  const canReportPost = user && String(post.postedBy?._id || post.postedBy) !== String(user._id);

  return (
    <main className="card" aria-label="Post Page">
      <h1>{post.title}</h1>
      <p>{renderTextWithLinks(post.content)}</p>
      <p className="meta-row">
        <span>Community: {post.community?.name || "Unknown community"}</span>
        <span>Posted by {displayNameOfUser(post.postedBy)}</span>
        {flairContentOf(post.linkFlair) && <span>Flair: {flairContentOf(post.linkFlair)}</span>}
        <span>Views: {post.views ?? 0}</span>
        <span>Comments: {commentCountOf(post)}</span>
        <span>Upvotes: {post.upvotes ?? 0}</span>
        <span>Downvotes: {post.downvotes ?? 0}</span>
      </p>
      {user ? (
        <div className="action-row">
          <button onClick={() => votePost("upvote")}>Upvote</button>
          <button onClick={() => votePost("downvote")}>Downvote</button>
          <SavePostButton
            user={user}
            postId={post._id}
            setMessage={setMessage}
            onUserRefresh={onUserRefresh}
          />
          {canReportPost && (
            <button type="button" onClick={() => setShowReportForm((value) => !value)}>
              {showReportForm ? "Cancel report" : "Report post"}
            </button>
          )}
        </div>
      ) : (
        <p className="muted">Login to vote or comment.</p>
      )}
      {showReportForm && (
        <form className="inline-form" onSubmit={submitReport}>
          <label htmlFor="reportReason">Reason</label>
          <select
            id="reportReason"
            value={reportForm.reason}
            onChange={(event) => setReportForm({ ...reportForm, reason: event.target.value })}
          >
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="off-topic">Off topic</option>
            <option value="other">Other</option>
          </select>
          <label htmlFor="reportDetails">Details</label>
          <textarea
            id="reportDetails"
            maxLength={400}
            placeholder="Optional context for moderators"
            value={reportForm.details}
            onChange={(event) => setReportForm({ ...reportForm, details: event.target.value })}
          />
          <div className="action-row">
            <button type="submit">Submit report</button>
            <button type="button" onClick={() => setShowReportForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <button onClick={() => setView("home")}>Back Home</button>
      <h2>Comments</h2>
      {user && (
        <form onSubmit={submitComment}>
          <textarea
            placeholder="Write a comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <button type="submit">Add Comment</button>
        </form>
      )}
      <div className="list-column">
        {(post.comments || []).length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          post.comments
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              user={user}
              postId={postId}
              depth={0}
              setMessage={setMessage}
              onReload={loadPost}
            />
            ))
        )}
      </div>
    </main>
  );
}
