import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams
} from "react-router-dom";
import { api } from "./api/client.js";
import AppShell from "./components/AppShell.jsx";
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
import UserProfile from "./pages/UserProfile.jsx";
import NotFound from "./pages/NotFound.jsx";

function Layout({
  user,
  communities,
  showMessage,
  refreshCurrentUser,
  refreshData,
  refreshToken,
  onLogout
}) {
  const navigate = useNavigate();
  const params = useParams();

  return (
    <>
      <div className="top-bar">
        <Banner user={user} onLogout={onLogout} />
      </div>
      <AppShell
        user={user}
        communities={communities}
        selectedCommunityId={params.communityId || null}
        onHome={() => navigate("/home")}
        onOpenCommunity={(id) => navigate(`/communities/${id}`)}
        onCreateCommunity={() => navigate("/communities/new")}
        onCreatePost={() => navigate("/posts/new")}
      >
        <Outlet
          context={{
            user,
            communities,
            showMessage,
            refreshCurrentUser,
            refreshData,
            refreshToken
          }}
        />
      </AppShell>
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [communities, setCommunities] = useState([]);

  const showMessage = useCallback((text, tone = "info") => {
    setMessage({ text, tone });
  }, []);

  const refreshData = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const refreshCurrentUser = useCallback(() => {
    api
      .me()
      .then((data) => {
        setUser(data.user);
        refreshData();
      })
      .catch((error) => showMessage(error.message, "error"));
  }, [refreshData, showMessage]);

  async function logout() {
    try {
      await api.logout();
      setUser(null);
      refreshData();
      showMessage("Logged out successfully.", "success");
      navigate("/");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => {
        showMessage(
          "Could not connect to server. Make sure the backend is running.",
          "error"
        );
      })
      .finally(() => setAuthChecked(true));
  }, [showMessage]);

  useEffect(() => {
    if (!authChecked) return;
    api
      .getCommunities()
      .then((data) => setCommunities(data.communities || []))
      .catch((error) => showMessage(error.message, "error"));
  }, [authChecked, refreshToken, user?._id, showMessage]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(id);
  }, [message]);

  if (!authChecked) {
    return (
      <main className="card">
        <p className="muted">Loading Phreddit...</p>
      </main>
    );
  }

  const isError = message?.tone === "error";

  return (
    <>
      {message && (
        <p
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
          className={`message message--${message.tone}`}
        >
          {message.text}
        </p>
      )}

      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <Welcome />}
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/home" replace />
            ) : (
              <Register setUser={setUser} showMessage={showMessage} />
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/home" replace />
            ) : (
              <Login setUser={setUser} showMessage={showMessage} />
            )
          }
        />
        <Route
          element={
            <Layout
              user={user}
              communities={communities}
              showMessage={showMessage}
              refreshCurrentUser={refreshCurrentUser}
              refreshData={refreshData}
              refreshToken={refreshToken}
              onLogout={logout}
            />
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/communities/new" element={<CreateCommunity />} />
          <Route path="/communities/:communityId" element={<Community />} />
          <Route path="/posts/new" element={<CreatePost />} />
          <Route path="/posts/:postId" element={<Post />} />
          <Route path="/users/:userId" element={<UserProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
