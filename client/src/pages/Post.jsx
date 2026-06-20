import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import CommentItem from "../components/CommentItem.jsx";
import { displayNameOfUser, flairContentOf, renderTextWithLinks } from "../utils/format.jsx";
import { commentCountOf } from "../utils/posts.js";

export default function Post({ user, postId, setView, setMessage, onSuccess }) {
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");

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

  if (!post) {
    return (
      <main className="card">
        <h1>Post</h1>
        <p>Loading post...</p>
      </main>
    );
  }

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
        </div>
      ) : (
        <p className="muted">Login to vote or comment.</p>
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
