import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import RichText from "../components/RichText.jsx";
import { displayNameOfUser, flairContentOf, formatDate, userIdOf } from "../utils/format.jsx";
import { commentCountOf } from "../utils/posts.js";

const PAGE_SIZE = 20;

export default function Community() {
  const { user, showMessage, refreshCurrentUser, refreshToken } = useOutletContext();
  const { communityId } = useParams();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    if (!communityId) return;
    api
      .getCommunity(communityId)
      .then((data) => setCommunity(data.community))
      .catch((error) => showMessage(error.message, "error"));
  }, [communityId, showMessage, refreshToken]);

  const loadPosts = useCallback(
    async (targetPage, append) => {
      if (!communityId) return;
      try {
        setLoading(true);
        const data = await api.getPosts({
          community: communityId,
          sort: currentSort,
          page: targetPage,
          limit: PAGE_SIZE
        });
        setPosts((previous) =>
          append ? [...previous, ...(data.posts || [])] : data.posts || []
        );
        setPage(data.page || targetPage);
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        showMessage(error.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [communityId, currentSort, showMessage]
  );

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts, refreshToken]);

  const isJoined = useMemo(() => {
    if (!user || !community) return false;
    return (community.members || []).some(
      (member) => String(member._id || member) === String(user._id)
    );
  }, [community, user]);

  async function toggleMembership() {
    if (!community) return;
    try {
      if (isJoined) {
        await api.leaveCommunity(community._id);
        showMessage("Left community successfully.", "success");
      } else {
        await api.joinCommunity(community._id);
        showMessage("Joined community successfully.", "success");
      }
      refreshCurrentUser();
    } catch (error) {
      showMessage(error.message, "error");
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

  return (
    <main className="card" aria-label="Community Page">
      <div className="page-header">
        <div>
          <h1>{community.name}</h1>
          <div className="page-subtitle">
            <RichText text={community.description} />
          </div>
        </div>
        <SortButtons currentSort={currentSort} onSortChange={setCurrentSort} />
      </div>
      <p className="meta-row">
        <span>Creator: {displayNameOfUser(community.creator)}</span>
        <span>Created: {formatDate(community.createdAt)}</span>
        <span>Members: {(community.members || []).length}</span>
      </p>
      {user && (
        <button onClick={toggleMembership}>{isJoined ? "Leave Community" : "Join Community"}</button>
      )}
      <button onClick={() => navigate("/home")}>Back Home</button>
      <p className="post-count">Showing {posts.length} of {total} posts</p>
      <div className="list-column">
        {loading && posts.length === 0 ? (
          <p className="muted">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts in this community yet.</p>
        ) : (
          posts.map((post) => {
            const authorId = userIdOf(post.postedBy);
            return (
              <article key={post._id} className="post-card">
                <p className="meta-row">
                  <span>
                    By{" "}
                    {authorId ? (
                      <Link className="inline-link" to={`/users/${authorId}`}>
                        {displayNameOfUser(post.postedBy)}
                      </Link>
                    ) : (
                      displayNameOfUser(post.postedBy)
                    )}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </p>
                <h3>
                  <Link className="inline-link strong" to={`/posts/${post._id}`}>
                    {post.title}
                  </Link>
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
            );
          })
        )}
      </div>
      {hasMore && (
        <button type="button" disabled={loading} onClick={() => loadPosts(page + 1, true)}>
          {loading ? "Loading..." : "Load more posts"}
        </button>
      )}
    </main>
  );
}
