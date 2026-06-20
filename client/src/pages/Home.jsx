import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import PostList from "../components/PostList.jsx";
import { sortPostsClient } from "../utils/posts.js";

export default function Home({
  user,
  setMessage,
  onOpenCommunity,
  onOpenPost,
  onUserRefresh,
  refreshToken
}) {
  const [posts, setPosts] = useState([]);
  const [flairs, setFlairs] = useState([]);
  const [selectedFlair, setSelectedFlair] = useState("");
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    Promise.all([
      api.getPosts({ linkFlair: selectedFlair }),
      api.getLinkFlairs().catch(() => ({ linkFlairs: [] }))
    ])
      .then(([postData, flairData]) => {
        setPosts(postData.posts || []);
        setFlairs(flairData.linkFlairs || []);
      })
      .catch((error) => setMessage(error.message));
  }, [setMessage, refreshToken, selectedFlair]);

  const sortedPosts = sortPostsClient(posts, currentSort);

  return (
    <main className="card" aria-label="Home Page">
      <div className="page-header">
        <div>
          <h1>Home</h1>
          <p className="page-subtitle">Browse the latest conversations across Phreddit.</p>
        </div>
        <SortButtons currentSort={currentSort} onSortChange={setCurrentSort} />
      </div>
      <div className="filter-row">
        <label htmlFor="homeFlair">Flair</label>
        <select
          id="homeFlair"
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
