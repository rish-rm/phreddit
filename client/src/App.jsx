import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import Banner from "./components/Banner.jsx";
import Welcome from "./pages/Welcome.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import CreateCommunity from "./pages/CreateCommunity.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Community from "./pages/Community.jsx";
import Post from "./pages/Post.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  const [view, setView] = useState("welcome");
  const [user, setUser] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  function goHome() {
    setSelectedCommunityId(null);
    setSelectedPostId(null);
    setView("home");
  }

  function refreshData() {
    setRefreshToken((current) => current + 1);
  }

  function submitSearch() {
    const query = searchValue.trim();
    if (!query) {
      goHome();
      return;
    }
    setSearchQuery(query);
    setView("search");
  }

  function refreshCurrentUser() {
    api
      .me()
      .then((data) => {
        setUser(data.user);
        refreshData();
      })
      .catch((error) => setMessage(error.message));
  }

  async function logout() {
    try {
      await api.logout();
      setUser(null);
      setView("welcome");
      setMessage("Logged out successfully.");
      refreshData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    api
      .me()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setView("home");
        }
      })
      .catch(() => {
        setMessage("Could not connect to server. Make sure the backend is running.");
      });
  }, []);

  return (
    <>
      {message && (
        <p role="status" className="message">
          {message}
        </p>
      )}

      {!["welcome", "register", "login"].includes(view) && (
        <div className="card compact-card">
          <Banner
            user={user}
            onHome={goHome}
            setView={setView}
            onLogout={logout}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchSubmit={submitSearch}
          />
        </div>
      )}

      {view === "welcome" && <Welcome setView={setView} />}
      {view === "register" && (
        <Register setView={setView} setMessage={setMessage} />
      )}
      {view === "login" && (
        <Login
          setView={setView}
          setUser={setUser}
          setMessage={setMessage}
        />
      )}
      {view === "home" && (
        <Home
          user={user}
          setView={setView}
          setMessage={setMessage}
          setSelectedCommunityId={setSelectedCommunityId}
          setSelectedPostId={setSelectedPostId}
          refreshToken={refreshToken}
        />
      )}
      {view === "search" && (
        <Search
          user={user}
          query={searchQuery}
          setView={setView}
          setMessage={setMessage}
          setSelectedPostId={setSelectedPostId}
          setSelectedCommunityId={setSelectedCommunityId}
          refreshToken={refreshToken}
        />
      )}
      {view === "create-community" && (
        <CreateCommunity
          setView={setView}
          setMessage={setMessage}
          onSuccess={refreshData}
        />
      )}
      {view === "create-post" && (
        <CreatePost
          user={user}
          setView={setView}
          setMessage={setMessage}
          onSuccess={refreshData}
        />
      )}
      {view === "community" && (
        <Community
          user={user}
          communityId={selectedCommunityId}
          setSelectedPostId={setSelectedPostId}
          setView={setView}
          setMessage={setMessage}
          onUserRefresh={refreshCurrentUser}
          refreshToken={refreshToken}
        />
      )}
      {view === "post" && (
        <Post
          user={user}
          postId={selectedPostId}
          setView={setView}
          setMessage={setMessage}
          onSuccess={refreshData}
        />
      )}
      {view === "profile" && (
        <Profile
          user={user}
          setMessage={setMessage}
          refreshToken={refreshToken}
          onUserRefresh={refreshCurrentUser}
        />
      )}
    </>
  );
}
