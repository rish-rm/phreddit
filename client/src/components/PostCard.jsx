import { Link } from "react-router-dom";
import { displayNameOfUser, flairContentOf, formatDate, userIdOf } from "../utils/format.jsx";
import { commentCountOf } from "../utils/posts.js";
import RichText from "./RichText.jsx";
import SavePostButton from "./SavePostButton.jsx";

export default function PostCard({
  post,
  user,
  showMessage,
  onUserRefresh,
  showCommunity = true
}) {
  const communityId = post.community?._id || post.community;
  const authorId = userIdOf(post.postedBy);

  return (
    <article className="post-card">
      <p className="meta-row">
        {showCommunity && (
          <Link className="inline-link" to={`/communities/${communityId}`}>
            {post.community?.name || "Unknown community"}
          </Link>
        )}
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
      </p>
      <h3>
        <Link className="inline-link strong" to={`/posts/${post._id}`}>
          {post.title}
        </Link>
      </h3>
      {flairContentOf(post.linkFlair) && (
        <span className="flair">{flairContentOf(post.linkFlair)}</span>
      )}
      <RichText text={post.content?.slice(0, 80) || ""} />
      <p className="meta-row">
        <span>{formatDate(post.createdAt)}</span>
        <span>Views: {post.views ?? 0}</span>
        <span>Comments: {commentCountOf(post)}</span>
        <span>Upvotes: {post.upvotes ?? 0}</span>
        <span>Downvotes: {post.downvotes ?? 0}</span>
      </p>
      <div className="action-row">
        <SavePostButton
          user={user}
          postId={post._id}
          showMessage={showMessage}
          onUserRefresh={onUserRefresh}
        />
      </div>
    </article>
  );
}
