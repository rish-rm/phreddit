export default function Banner({
  user,
  onHome,
  setView,
  onLogout,
  searchValue,
  onSearchChange,
  onSearchSubmit
}) {
  function handlePhredditClick() {
    if (user) {
      onHome();
    } else {
      setView("welcome");
    }
  }

  function handleSearchKey(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearchSubmit();
    }
  }

  return (
    <header className="banner">
      <button onClick={handlePhredditClick}>phreddit</button>
      <button onClick={onHome}>Home</button>
      <input
        type="text"
        className="banner-search"
        aria-label="Search Phreddit"
        placeholder="Search Phreddit…"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={handleSearchKey}
      />
      <button
        disabled={!user}
        onClick={() => user && setView("create-post")}
      >
        Create Post
      </button>
      <button
        disabled={!user}
        onClick={() => {
          if (user) setView("profile");
        }}
      >
        {user ? user.displayName : "Guest"}
      </button>
      {!user && <button onClick={() => setView("login")}>Login</button>}
      {!user && <button onClick={() => setView("register")}>Register</button>}
      {user && <button onClick={onLogout}>Logout</button>}
    </header>
  );
}
