import { displayNameOfUser, flairContentOf, formatDate, renderTextWithLinks } from "../utils/format.jsx";
import { commentCountOf } from "../utils/posts.js";
import SavePostButton from "./SavePostButton.jsx";

export default function PostCard({
  post,
  user,
  onOpenPost,
  onOpenCommunity,
  setMessage,
  onUserRefresh
}) {
  return (
    <article className="post-card">
      <p className="meta-row">
        <button className="inline-link" onClick={() => onOpenCommunity(post.community?._id || post.community)}>
          {post.community?.name || "Unknown community"}
        </button>
        <span>Posted by {displayNameOfUser(post.postedBy)}</span>
      </p>
      <h3>
        <button className="inline-link strong" onClick={() => onOpenPost(post._id)}>
          {post.title}
        </button>
      </h3>
      {flairContentOf(post.linkFlair) && (
        <span className="flair">{flairContentOf(post.linkFlair)}</span>
      )}
      <p>{renderTextWithLinks(post.content)}</p>
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
          setMessage={setMessage}
          onUserRefresh={onUserRefresh}
        />
      </div>
    </article>
  );
}
