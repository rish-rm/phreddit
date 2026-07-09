import { useCallback, useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import PostList from "../components/PostList.jsx";

const PAGE_SIZE = 20;

export default function Search() {
  const { user, showMessage, refreshCurrentUser, refreshToken } = useOutletContext();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flairs, setFlairs] = useState([]);
  const [selectedFlair, setSelectedFlair] = useState("");
  const [currentSort, setCurrentSort] = useState("newest");

  const load = useCallback(
    async (targetPage, append) => {
      if (!query) {
        setPosts([]);
        setTotal(0);
        setHasMore(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await api.getPosts({
          search: query,
          linkFlair: selectedFlair || undefined,
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
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    [query, selectedFlair, currentSort]
  );

  useEffect(() => {
    load(1, false);
  }, [load, refreshToken]);

  useEffect(() => {
    api
      .getLinkFlairs()
      .then((data) => setFlairs(data.linkFlairs || []))
      .catch(() => setFlairs([]));
  }, [refreshToken]);

  const headerText = !query
    ? "Type a search above to find posts."
    : total === 0 && !loading
      ? `No results found for: ${query}`
      : `Results for: ${query}`;

  return (
    <main className="card" aria-label="Search Results Page">
      <div className="page-header">
        <div>
          <h1>Search</h1>
          <p className="page-subtitle">{headerText}</p>
        </div>
        <SortButtons currentSort={currentSort} onSortChange={setCurrentSort} />
      </div>
      <div className="filter-row">
        <label htmlFor="searchFlair">Flair</label>
        <select
          id="searchFlair"
          value={selectedFlair}
          onChange={(event) => setSelectedFlair(event.target.value)}
        >
          <option value="">All flairs</option>
          {flairs.map((flair) => (
            <option key={flair._id} value={flair._id}>{flair.content}</option>
          ))}
        </select>
        {selectedFlair && (
          <button type="button" onClick={() => setSelectedFlair("")}>Clear</button>
        )}
      </div>
      <p className="post-count">Showing {posts.length} of {total} posts</p>
      {error && (
        <p className="muted">
          {error}{" "}
          <button type="button" onClick={() => load(1, false)}>Retry</button>
        </p>
      )}
      {loading && posts.length === 0 ? (
        <p className="muted">Searching...</p>
      ) : (
        <div className="list-column">
          <PostList
            posts={posts}
            user={user}
            showMessage={showMessage}
            onUserRefresh={refreshCurrentUser}
          />
        </div>
      )}
      {hasMore && (
        <button type="button" disabled={loading} onClick={() => load(page + 1, true)}>
          {loading ? "Loading..." : "Load more results"}
        </button>
      )}
    </main>
  );
}
