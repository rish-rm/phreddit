import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import PostList from "../components/PostList.jsx";
import { sortPostsClient } from "../utils/posts.js";

export default function Search({
  user,
  query,
  setMessage,
  onOpenPost,
  onOpenCommunity,
  onUserRefresh,
  refreshToken
}) {
  const [posts, setPosts] = useState([]);
  const [flairs, setFlairs] = useState([]);
  const [selectedFlair, setSelectedFlair] = useState("");
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    if (!query) {
      setPosts([]);
      return;
    }
    Promise.all([
      api.getPosts({ search: query, linkFlair: selectedFlair }),
      api.getLinkFlairs().catch(() => ({ linkFlairs: [] }))
    ])
      .then(([postData, flairData]) => {
        setPosts(postData.posts || []);
        setFlairs(flairData.linkFlairs || []);
      })
      .catch((error) => setMessage(error.message));
  }, [query, setMessage, refreshToken, selectedFlair]);

  const sortedPosts = sortPostsClient(posts, currentSort);
  const headerText = sortedPosts.length === 0
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
      <p className="post-count">{sortedPosts.length} posts</p>
      <div className="list-column">
        <PostList
          posts={sortedPosts}
          user={user}
          onOpenPost={onOpenPost}
          onOpenCommunity={onOpenCommunity}
          setMessage={setMessage}
          onUserRefresh={onUserRefresh}
        />
      </div>
    </main>
  );
}
