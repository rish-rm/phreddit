import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { formatDate } from "../utils/format.jsx";

// Public, guest-visible profile: display name, reputation, and recent
// activity. Private details (email, saved posts) never appear here.
export default function UserProfile() {
  const { showMessage } = useOutletContext();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setError("");
    api
      .getPublicProfile(userId)
      .then((data) => setProfile(data))
      .catch((loadError) => {
        setError(loadError.message);
        showMessage(loadError.message, "error");
      });
  }, [userId, showMessage]);

  if (error) {
    return (
      <main className="card">
        <h1>User</h1>
        <p>{error}</p>
        <Link className="inline-link" to="/home">Back to Home</Link>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="card">
        <h1>User</h1>
        <p className="muted">Loading profile...</p>
      </main>
    );
  }

  const { user, posts, comments } = profile;

  return (
    <main className="card" aria-label="Public Profile Page">
      <h1>{user.displayName}</h1>
      <p className="meta-row">
        <span>Reputation: {user.reputation}</span>
        <span>Member since: {formatDate(user.createdAt)}</span>
      </p>

      <h2>Recent posts</h2>
      <div className="list-column">
        {(posts || []).length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="row-card">
              <div className="row-card-text">
                <Link className="inline-link strong" to={`/posts/${post._id}`}>
                  {post.title}
                </Link>
                <span className="row-card-subtitle">
                  {post.community?.name ? `in ${post.community.name} · ` : ""}
                  {formatDate(post.createdAt)} · ▲ {post.upvotes ?? 0} ▼ {post.downvotes ?? 0}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <h2>Recent comments</h2>
      <div className="list-column">
        {(comments || []).length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="row-card">
              <div className="row-card-text">
                <span className="row-card-title">{comment.content}</span>
                <span className="row-card-subtitle">
                  {comment.post?.title ? (
                    <>
                      on{" "}
                      <Link className="inline-link" to={`/posts/${comment.post._id}`}>
                        {comment.post.title}
                      </Link>{" "}
                      ·{" "}
                    </>
                  ) : null}
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
