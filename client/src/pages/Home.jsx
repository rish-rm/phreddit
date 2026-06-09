import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Sidebar from "../components/Sidebar.jsx";
import SortButtons from "../components/SortButtons.jsx";
import PostList from "../components/PostList.jsx";
import { sortPostsClient } from "../utils/posts.js";

export default function Home({
  user,
  setView,
  setMessage,
  setSelectedCommunityId,
  setSelectedPostId,
  refreshToken
}) {
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentSort, setCurrentSort] = useState("newest");

  useEffect(() => {
    Promise.all([api.getCommunities(), api.getPosts()])
      .then(([communityData, postData]) => {
        setCommunities(communityData.communities || []);
        setPosts(postData.posts || []);
      })
      .catch((error) => setMessage(error.message));
  }, [setMessage, refreshToken]);

  function openCommunity(id) {
    setSelectedCommunityId(id);
    setView("community");
  }

  function openPost(id) {
    setSelectedPostId(id);
    setView("post");
  }

  const sortedPosts = sortPostsClient(posts, currentSort);

  return (
    <main className="card" aria-label="Home Page">
      <div className="layout-grid">
        <Sidebar
          user={user}
          communities={communities}
          onHome={() => setView("home")}
          onOpenCommunity={openCommunity}
          onCreateCommunity={() => setView("create-community")}
          onCreatePost={() => setView("create-post")}
        />
        <section>
          <div className="page-header">
            <h2>Home</h2>
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
        </section>
      </div>
    </main>
  );
}
