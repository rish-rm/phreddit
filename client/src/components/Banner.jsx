import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Banner({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  function submitSearch() {
    const query = searchValue.trim();
    if (!query) {
      navigate("/home");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  function handleSearchKey(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  }

  return (
    <header className="banner">
      <button onClick={() => navigate(user ? "/home" : "/")}>phreddit</button>
      <button onClick={() => navigate("/home")}>Home</button>
      <input
        type="text"
        className="banner-search"
        aria-label="Search Phreddit"
        placeholder="Search Phreddit..."
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        onKeyDown={handleSearchKey}
      />
      <button disabled={!user} onClick={() => user && navigate("/posts/new")}>
        Create Post
      </button>
      <button disabled={!user} onClick={() => user && navigate("/profile")}>
        {user ? user.displayName : "Guest"}
      </button>
      {!user && <button onClick={() => navigate("/login")}>Login</button>}
      {!user && <button onClick={() => navigate("/register")}>Register</button>}
      {user && <button onClick={onLogout}>Logout</button>}
    </header>
  );
}
