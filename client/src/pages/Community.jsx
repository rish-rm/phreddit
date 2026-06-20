import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import { displayNameOfUser, flairContentOf, formatDate, renderTextWithLinks } from "../utils/format.jsx";
import { commentCountOf, sortPostsClient } from "../utils/posts.js";

export default function Community({
  user,
  communityId,
  onOpenPost,
  setView,
  setMessage,
  onUserRefresh,
  refreshToken
}) {
  const [community, setCommunity] = useState(null);
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    if (!communityId) return;
    api
      .getCommunity(communityId)
      .then((data) => setCommunity(data.community))
      .catch((error) => setMessage(error.message));
  }, [communityId, setMessage, refreshToken]);

  const isJoined = useMemo(() => {
    if (!user || !community) return false;
    return (community.members || []).some((member) => String(member._id || member) === String(user._id));
  }, [community, user]);

  async function toggleMembership() {
    if (!community) return;
    try {
      if (isJoined) {
        await api.leaveCommunity(community._id);
        setMessage("Left community successfully.");
      } else {
        await api.joinCommunity(community._id);
        setMessage("Joined community successfully.");
      }
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!community) {
    return (
      <main className="card">
        <h1>Community</h1>
        <p>Loading community...</p>
      </main>
    );
  }

  const sortedPosts = sortPostsClient(community.posts || [], currentSort);

  return (
    <main className="card" aria-label="Community Page">
      <div className="page-header">
        <div>
          <h1>{community.name}</h1>
          <p className="page-subtitle">{renderTextWithLinks(community.description)}</p>
        </div>
        <SortButtons currentSort={currentSort} onSortChange={setCurrentSort} />
      </div>
      <p className="meta-row">
        <span>Creator: {displayNameOfUser(community.creator)}</span>
        <span>Created: {formatDate(community.createdAt)}</span>
      </p>
      {user && (
        <button onClick={toggleMembership}>{isJoined ? "Leave Community" : "Join Community"}</button>
      )}
      <button onClick={() => setView("home")}>Back Home</button>
      <p className="post-count">{sortedPosts.length} posts</p>
      <div className="list-column">
        {sortedPosts.length === 0 ? (
          <p>No posts in this community yet.</p>
        ) : (
          sortedPosts.map((post) => (
            <article key={post._id} className="post-card">
              <p className="meta-row">
                <span>By {displayNameOfUser(post.postedBy)}</span>
                <span>{formatDate(post.createdAt)}</span>
              </p>
              <h3>
                <button
                  className="inline-link strong"
                  onClick={() => {
                    onOpenPost(post._id);
                  }}
                >
                  {post.title}
                </button>
              </h3>
              {flairContentOf(post.linkFlair) && (
                <span className="flair">{flairContentOf(post.linkFlair)}</span>
              )}
              <p className="meta-row">
                <span>Views: {post.views ?? 0}</span>
                <span>Comments: {commentCountOf(post)}</span>
                <span>Upvotes: {post.upvotes ?? 0}</span>
                <span>Downvotes: {post.downvotes ?? 0}</span>
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
