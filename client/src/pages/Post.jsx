import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { subscribeToPost } from "../realtime.js";
import CommentItem from "../components/CommentItem.jsx";
import RichText from "../components/RichText.jsx";
import SavePostButton from "../components/SavePostButton.jsx";
import { displayNameOfUser, flairContentOf, formatDate, userIdOf } from "../utils/format.jsx";
import { commentCountOf, sortComments } from "../utils/posts.js";

export default function Post() {
  const { user, showMessage, refreshCurrentUser } = useOutletContext();
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [commentSort, setCommentSort] = useState("newest");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    reason: "spam",
    details: ""
  });

  const loadPost = useCallback(async () => {
    if (!postId) return;
    try {
      setLoadError("");
      const data = await api.getPost(postId);
      setPost(data.post);
    } catch (error) {
      setPost(null);
      setLoadError(error.message);
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [postId, showMessage]);

  // Initial load + one explicit view count per visit.
  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!postId) return;
    api.viewPost(postId).catch(() => {});
  }, [postId]);

  // Live updates: refetch whenever anyone comments, votes, or edits.
  useEffect(() => {
    if (!postId) return undefined;
    return subscribeToPost(postId, () => {
      loadPost();
    });
  }, [postId, loadPost]);

  const sortedComments = useMemo(
    () => sortComments(post?.comments || [], commentSort),
    [post, commentSort]
  );

  const isOwnPost =
    user && post && String(userIdOf(post.postedBy)) === String(user._id);
  const canVote = Boolean(user) && (user.reputation ?? 0) >= 50 && !isOwnPost;
  const voteHint = !user
    ? undefined
    : (user.reputation ?? 0) < 50
      ? "Voting requires a reputation of at least 50."
      : isOwnPost
        ? "You cannot vote on your own post."
        : undefined;

  async function votePost(voteType) {
    try {
      const data = await api.votePost(postId, voteType);
      setPost((previous) =>
        previous
          ? {
              ...previous,
              upvotes: data.post.upvotes,
              downvotes: data.post.downvotes,
              userVote: data.post.userVote
            }
          : previous
      );
      showMessage(data.message, "success");
      refreshCurrentUser();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    try {
      const data = await api.reportPost(postId, reportForm);
      showMessage(data.message, "success");
      setShowReportForm(false);
      setReportForm({ reason: "spam", details: "" });
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  if (!post) {
    return (
      <main className="card">
        <h1>Post</h1>
        {loading ? (
          <p>Loading post...</p>
        ) : (
          <div className="error-state" role="alert">
            <p>{loadError || "This post is unavailable."}</p>
            <div className="action-row">
              <button type="button" onClick={() => { setLoading(true); loadPost(); }}>Retry</button>
              <button type="button" onClick={() => navigate("/home")}>Back Home</button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const canReportPost = user && !isOwnPost;
  const communityId = post.community?._id || post.community;
  const authorId = userIdOf(post.postedBy);

  return (
    <main className="card" aria-label="Post Page">
      <h1>{post.title}</h1>
      <RichText text={post.content} />
      <p className="meta-row">
        <span>
          Community:{" "}
          <Link className="inline-link" to={`/communities/${communityId}`}>
            {post.community?.name || "Unknown community"}
          </Link>
        </span>
        <span>Posted: {formatDate(post.createdAt)}</span>
        <span>
          Posted by{" "}
          {authorId ? (
            <Link className="inline-link" to={`/users/${authorId}`}>
              {displayNameOfUser(post.postedBy)}
            </Link>
          ) : (
            displayNameOfUser(post.postedBy)
          )}
        </span>
        {flairContentOf(post.linkFlair) && <span>Flair: {flairContentOf(post.linkFlair)}</span>}
        <span>Views: {post.views ?? 0}</span>
        <span>Comments: {commentCountOf(post)}</span>
      </p>
      {user ? (
        <div className="action-row">
          <button
            type="button"
            aria-pressed={post.userVote === "upvote"}
            className={post.userVote === "upvote" ? "vote-btn active" : "vote-btn"}
            disabled={!canVote}
            title={voteHint}
            onClick={() => votePost("upvote")}
          >
            Upvote · {post.upvotes ?? 0}
          </button>
          <button
            type="button"
            aria-pressed={post.userVote === "downvote"}
            className={post.userVote === "downvote" ? "vote-btn active" : "vote-btn"}
            disabled={!canVote}
            title={voteHint}
            onClick={() => votePost("downvote")}
          >
            Downvote · {post.downvotes ?? 0}
          </button>
          <SavePostButton
            user={user}
            postId={post._id}
            showMessage={showMessage}
            onUserRefresh={refreshCurrentUser}
          />
          {canReportPost && (
            <button type="button" onClick={() => setShowReportForm((value) => !value)}>
              {showReportForm ? "Cancel report" : "Report post"}
            </button>
          )}
        </div>
      ) : (
        <p className="muted">
          Upvotes: {post.upvotes ?? 0} · Downvotes: {post.downvotes ?? 0} — login to vote or comment.
        </p>
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
      <button onClick={() => navigate("/home")}>Back Home</button>
      <div className="page-header">
        <h2>Comments</h2>
        <div className="action-row">
          <button
            type="button"
            aria-pressed={commentSort === "newest"}
            className={commentSort === "newest" ? "active" : ""}
            onClick={() => setCommentSort("newest")}
          >
            Newest
          </button>
          <button
            type="button"
            aria-pressed={commentSort === "top"}
            className={commentSort === "top" ? "active" : ""}
            onClick={() => setCommentSort("top")}
          >
            Top
          </button>
        </div>
      </div>
      {user && (
        <button type="button" onClick={() => navigate(`/posts/${postId}/comments/new`)}>
          Add a comment
        </button>
      )}
      <div className="list-column">
        {sortedComments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              user={user}
              postId={postId}
              depth={0}
              showMessage={showMessage}
              onReload={loadPost}
            />
          ))
        )}
      </div>
    </main>
  );
}
