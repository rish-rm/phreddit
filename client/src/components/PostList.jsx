import PostCard from "./PostCard.jsx";
import { splitPostsByMembership } from "../utils/posts.js";

export default function PostList({
  posts,
  user,
  onOpenPost,
  onOpenCommunity,
  setMessage,
  onUserRefresh
}) {
  if (posts.length === 0) {
    return <p>No posts yet.</p>;
  }

  const { joinedPosts, otherPosts } = splitPostsByMembership(posts, user);
  if (!user) {
    return (
      <>
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            user={user}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
            setMessage={setMessage}
            onUserRefresh={onUserRefresh}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <p className="list-demarcation">Joined Communities</p>
      {joinedPosts.length === 0 ? (
        <p className="muted">No posts from your joined communities.</p>
      ) : (
        joinedPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            user={user}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
            setMessage={setMessage}
            onUserRefresh={onUserRefresh}
          />
        ))
      )}

      <p className="list-demarcation">Other Communities</p>
      {otherPosts.length === 0 ? (
        <p className="muted">No posts from other communities.</p>
      ) : (
        otherPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            user={user}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
            setMessage={setMessage}
            onUserRefresh={onUserRefresh}
          />
        ))
      )}
    </>
  );
}
