import PostCard from "./PostCard.jsx";
import { splitPostsByMembership } from "../utils/posts.js";

export default function PostList({ posts, user, showMessage, onUserRefresh }) {
  if (posts.length === 0) {
    return <p>No posts yet.</p>;
  }

  const renderCard = (post) => (
    <PostCard
      key={post._id}
      post={post}
      user={user}
      showMessage={showMessage}
      onUserRefresh={onUserRefresh}
    />
  );

  if (!user) {
    return <>{posts.map(renderCard)}</>;
  }

  const { joinedPosts, otherPosts } = splitPostsByMembership(posts, user);

  return (
    <>
      <p className="list-demarcation">Joined Communities</p>
      {joinedPosts.length === 0 ? (
        <p className="muted">No posts from your joined communities.</p>
      ) : (
        joinedPosts.map(renderCard)
      )}

      <p className="list-demarcation">Other Communities</p>
      {otherPosts.length === 0 ? (
        <p className="muted">No posts from other communities.</p>
      ) : (
        otherPosts.map(renderCard)
      )}
    </>
  );
}
