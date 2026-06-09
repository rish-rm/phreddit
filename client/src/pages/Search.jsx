import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import SortButtons from "../components/SortButtons.jsx";
import PostList from "../components/PostList.jsx";
import { sortPostsClient } from "../utils/posts.js";

export default function Search({
  user,
  query,
  setView,
  setMessage,
  setSelectedPostId,
  setSelectedCommunityId,
  refreshToken
}) {
  const [posts, setPosts] = useState([]);
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    if (!query) {
      setPosts([]);
      return;
    }
    api
      .getPosts({ search: query })
      .then((data) => setPosts(data.posts || []))
      .catch((error) => setMessage(error.message));
  }, [query, setMessage, refreshToken]);

  function openCommunity(id) {
    setSelectedCommunityId(id);
    setView("community");
  }

  function openPost(id) {
    setSelectedPostId(id);
    setView("post");
  }

  const sortedPosts = sortPostsClient(posts, currentSort);
  const headerText = sortedPosts.length === 0
    ? `No results found for: ${query}`
    : `Results for: ${query}`;

  return (
    <main className="card" aria-label="Search Results Page">
      <div className="page-header">
        <h2>{headerText}</h2>
        <SortButtons currentSort={currentSort} onSortChange={setCurrentSort} />
      </div>
      <p className="post-count">{sortedPosts.length} posts</p>
      <div className="list-column">
        <PostList
          posts={sortedPosts}
          user={user}
          onOpenPost={openPost}
          onOpenCommunity={openCommunity}
        />
      </div>
    </main>
  );
}
