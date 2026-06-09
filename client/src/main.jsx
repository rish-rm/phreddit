import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api/client.js";
import "./style.css";

function displayNameOfUser(user) {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.displayName || user.email || "Unknown";
}

function flairContentOf(linkFlair) {
  if (!linkFlair || typeof linkFlair === "string") return "";
  return linkFlair.content || "";
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffDay < 1) {
    if (diffMin < 1) return `${diffSec} seconds ago`;
    if (diffHour < 1) return `${diffMin} minutes ago`;
    return `${diffHour} hours ago`;
  }
  if (diffDay < 30) return `${diffDay} days ago`;
  if (diffDay < 365) return `${diffMonth} month(s) ago`;
  return `${diffYear} year(s) ago`;
}

function renderTextWithLinks(text) {
  if (!text || typeof text !== "string") return text;
  const parts = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a key={`link-${key++}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}

function Banner({
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

function Welcome({ setView }) {
  return (
    <main className="card" aria-label="Welcome Page">
      <h1>Welcome to Phreddit</h1>
      <p>Choose how you'd like to enter the application.</p>
      <div className="action-row">
        <button onClick={() => setView("register")}>Register</button>
        <button onClick={() => setView("login")}>Login</button>
        <button onClick={() => setView("home")}>Continue as Guest</button>
      </div>
    </main>
  );
}

function Register({ setView, setMessage }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    displayName: "",
    password: "",
    confirmPassword: ""
  });

  async function submit(event) {
    event.preventDefault();
    try {
      await api.register(form);
      setMessage("Account created successfully. Please log in.");
      setView("welcome");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="card" aria-label="Register Page">
      <h1>Sign Up</h1>
      <form onSubmit={submit}>
        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          placeholder="First name"
          value={form.firstName}
          onChange={(event) => setForm({ ...form, firstName: event.target.value })}
        />
        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          placeholder="Last name"
          value={form.lastName}
          onChange={(event) => setForm({ ...form, lastName: event.target.value })}
        />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          placeholder="Display name"
          value={form.displayName}
          onChange={(event) => setForm({ ...form, displayName: event.target.value })}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          placeholder="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
        />
        <button type="submit">Sign Up</button>
      </form>
    </main>
  );
}

function Login({ setView, setUser, setMessage }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await api.login(form);
      setUser(data.user);
      setMessage("Logged in successfully.");
      setView("home");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="card" aria-label="Login Page">
      <h1>Login</h1>
      <form onSubmit={submit}>
        <label htmlFor="loginEmail">Email</label>
        <input
          id="loginEmail"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button type="submit">Login</button>
      </form>
    </main>
  );
}

function Sidebar({
  user,
  communities,
  onHome,
  onOpenCommunity,
  onCreateCommunity,
  onCreatePost
}) {
  return (
    <aside className="sidebar">
      <h3>Navigation</h3>
      <button onClick={onHome}>Home</button>
      <button disabled={!user} onClick={onCreateCommunity}>
        Create Community
      </button>
      <button disabled={!user} onClick={onCreatePost}>
        Create Post
      </button>
      <h3>Communities</h3>
      <div className="list-column">
        {communities.length === 0 ? (
          <p className="muted">No communities yet.</p>
        ) : (
          communities.map((community) => (
            <button
              key={community._id}
              className="link-button"
              onClick={() => onOpenCommunity(community._id)}
            >
              {community.name}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function PostCard({ post, onOpenPost, onOpenCommunity }) {
  return (
    <article className="post-card">
      <p className="meta-row">
        <button className="inline-link" onClick={() => onOpenCommunity(post.community?._id || post.community)}>
          {post.community?.name || "Unknown community"}
        </button>
        <span>Posted by {displayNameOfUser(post.postedBy)}</span>
      </p>
      <h3>
        <button className="inline-link strong" onClick={() => onOpenPost(post._id)}>
          {post.title}
        </button>
      </h3>
      {flairContentOf(post.linkFlair) && (
        <span className="flair">{flairContentOf(post.linkFlair)}</span>
      )}
      <p>{renderTextWithLinks(post.content)}</p>
      <p className="meta-row">
        <span>{formatDate(post.createdAt)}</span>
        <span>Views: {post.views ?? 0}</span>
        <span>Comments: {Array.isArray(post.comments) ? post.comments.length : 0}</span>
        <span>Upvotes: {post.upvotes ?? 0}</span>
        <span>Downvotes: {post.downvotes ?? 0}</span>
      </p>
    </article>
  );
}

function SortButtons({ currentSort, onSortChange }) {
  return (
    <div className="action-row">
      <button
        className={currentSort === "newest" ? "active" : ""}
        onClick={() => onSortChange("newest")}
      >
        Newest
      </button>
      <button
        className={currentSort === "oldest" ? "active" : ""}
        onClick={() => onSortChange("oldest")}
      >
        Oldest
      </button>
      <button
        className={currentSort === "active" ? "active" : ""}
        onClick={() => onSortChange("active")}
      >
        Active
      </button>
    </div>
  );
}

function latestActivityTime(post) {
  const commentDates = (post.comments || [])
    .map((comment) => new Date(comment.createdAt || comment).getTime())
    .filter(Number.isFinite);
  return Math.max(new Date(post.createdAt).getTime(), ...commentDates);
}

function sortPostsClient(posts, order) {
  const copy = [...posts];
  if (order === "oldest") {
    return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  if (order === "active") {
    return copy.sort((a, b) => latestActivityTime(b) - latestActivityTime(a));
  }
  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getJoinedCommunityIdSet(user) {
  const ids = (user?.joinedCommunities || [])
    .map((community) => String(community?._id || community))
    .filter(Boolean);
  return new Set(ids);
}

function splitPostsByMembership(posts, user) {
  if (!user) {
    return { joinedPosts: [], otherPosts: posts };
  }
  const joinedIds = getJoinedCommunityIdSet(user);
  const joinedPosts = [];
  const otherPosts = [];
  for (const post of posts) {
    const communityId = String(post?.community?._id || post?.community || "");
    if (joinedIds.has(communityId)) {
      joinedPosts.push(post);
    } else {
      otherPosts.push(post);
    }
  }
  return { joinedPosts, otherPosts };
}

function PostListWithMembershipDemarcation({ posts, user, onOpenPost, onOpenCommunity }) {
  if (posts.length === 0) {
    return <p>No posts yet.</p>;
  }

  const { joinedPosts, otherPosts } = splitPostsByMembership(posts, user);
  if (!user) {
    return (
      <>
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <p className="list-demarcation">Joined Communities</p>
      {joinedPosts.length === 0 ? (
        <p className="muted">No posts from your joined communities.</p>
      ) : (
        joinedPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
          />
        ))
      )}

      <p className="list-demarcation">Other Communities</p>
      {otherPosts.length === 0 ? (
        <p className="muted">No posts from other communities.</p>
      ) : (
        otherPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onOpenPost={onOpenPost}
            onOpenCommunity={onOpenCommunity}
          />
        ))
      )}
    </>
  );
}

function Home({
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
            <PostListWithMembershipDemarcation
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

function SearchPage({
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
        <PostListWithMembershipDemarcation
          posts={sortedPosts}
          user={user}
          onOpenPost={openPost}
          onOpenCommunity={openCommunity}
        />
      </div>
    </main>
  );
}

function CreateCommunity({ setView, setMessage, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  async function submit(event) {
    event.preventDefault();
    try {
      await api.createCommunity(form);
      onSuccess();
      setMessage("Community created successfully.");
      setView("home");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="card" aria-label="New Community Page">
      <h1>New Community</h1>
      <form onSubmit={submit}>
        <input
          id="communityName"
          placeholder="Community name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <textarea
          id="communityDescription"
          placeholder="Community description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button type="submit">Submit</button>
        <button type="button" onClick={() => setView("home")}>Cancel</button>
      </form>
    </main>
  );
}

function CreatePost({ user, setView, setMessage, onSuccess }) {
  const [form, setForm] = useState({
    community: "",
    title: "",
    content: "",
    linkFlair: "",
    newFlair: ""
  });
  const [communities, setCommunities] = useState([]);
  const [flairs, setFlairs] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getCommunities(),
      api.getLinkFlairs().catch(() => ({ linkFlairs: [] }))
    ])
      .then(([communityData, flairData]) => {
        const list = communityData.communities || [];
        setCommunities(list);
        if (list.length > 0) {
          setForm((current) => ({ ...current, community: current.community || list[0]._id }));
        }
        const flairList = Array.isArray(flairData?.linkFlairs)
          ? flairData.linkFlairs
          : Array.isArray(flairData)
            ? flairData
            : [];
        setFlairs(flairList);
      })
      .catch((error) => setMessage(error.message));
  }, [setMessage]);

  if (!user) {
    return (
      <main className="card">
        <h1>Create Post</h1>
        <p>You must be logged in to create posts.</p>
        <button onClick={() => setView("home")}>Back Home</button>
      </main>
    );
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.title.trim() || form.title.length > 100) {
      setMessage("Title is required and must be 100 characters or less.");
      return;
    }
    if (!form.content.trim()) {
      setMessage("Content is required.");
      return;
    }
    if (form.newFlair && form.newFlair.length > 30) {
      setMessage("New link flair must be 30 characters or less.");
      return;
    }

    try {
      let linkFlairId = form.linkFlair || null;

      if (form.newFlair.trim()) {
        const data = await api.createLinkFlair({ content: form.newFlair.trim() });
        linkFlairId = (data.linkFlair?._id) || data._id;
      }

      await api.createPost({
        community: form.community,
        title: form.title.trim(),
        content: form.content.trim(),
        linkFlair: linkFlairId
      });
      onSuccess();
      setMessage("Post created successfully.");
      setView("home");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="card" aria-label="Create Post Page">
      <h1>Create Post</h1>
      <form onSubmit={submit}>
        <label>Community*</label>
        <select
          value={form.community}
          onChange={(event) => setForm({ ...form, community: event.target.value })}
        >
          {communities.map((community) => (
            <option key={community._id} value={community._id}>
              {community.name}
            </option>
          ))}
        </select>

        <label>Title* (max 100 chars)</label>
        <input
          placeholder="Post title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />

        <label>Link flair (optional)</label>
        <select
          value={form.linkFlair}
          onChange={(event) => setForm({ ...form, linkFlair: event.target.value })}
        >
          <option value="">— No flair —</option>
          {flairs.map((flair) => (
            <option key={flair._id} value={flair._id}>
              {flair.content}
            </option>
          ))}
        </select>

        <label>Or new flair (max 30 chars)</label>
        <input
          placeholder="New flair text"
          value={form.newFlair}
          onChange={(event) => setForm({ ...form, newFlair: event.target.value })}
        />

        <label>Content*</label>
        <textarea
          placeholder="Post content"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
        />
        <button type="submit">Submit</button>
        <button type="button" onClick={() => setView("home")}>Cancel</button>
      </form>
    </main>
  );
}

function CommunityPage({
  user,
  communityId,
  setSelectedPostId,
  setView,
  setMessage,
  onUserRefresh,
  refreshToken
}) {
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    if (!communityId) return;
    api
      .getCommunity(communityId)
      .then((data) => setCommunity(data.community))
      .catch((error) => setMessage(error.message));
  }, [communityId, setMessage, refreshToken]);

  const isJoined = useMemo(() => {
    if (!user || !community) return false;
    return (community.members || []).some((member) => String(member._id || member) === String(user._id));
  }, [community, user]);

  async function toggleMembership() {
    if (!community) return;
    try {
      if (isJoined) {
        await api.leaveCommunity(community._id);
        setMessage("Left community successfully.");
      } else {
        await api.joinCommunity(community._id);
        setMessage("Joined community successfully.");
      }
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
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
      <h1>{community.name}</h1>
      <p>{renderTextWithLinks(community.description)}</p>
      <p className="meta-row">
        <span>Creator: {displayNameOfUser(community.creator)}</span>
        <span>Created: {formatDate(community.createdAt)}</span>
      </p>
      {user && (
        <button onClick={toggleMembership}>{isJoined ? "Leave Community" : "Join Community"}</button>
      )}
      <button onClick={() => setView("home")}>Back Home</button>
      <h2>Posts</h2>
      <p className="post-count">{(community.posts || []).length} posts</p>
      <div className="list-column">
        {(community.posts || []).length === 0 ? (
          <p>No posts in this community yet.</p>
        ) : (
          community.posts.map((post) => (
            <article key={post._id} className="post-card">
              <p className="meta-row">
                <span>By {displayNameOfUser(post.postedBy)}</span>
                <span>{formatDate(post.createdAt)}</span>
              </p>
              <h3>
                <button
                  className="inline-link strong"
                  onClick={() => {
                    setSelectedPostId(post._id);
                    setView("post");
                  }}
                >
                  {post.title}
                </button>
              </h3>
              {flairContentOf(post.linkFlair) && (
                <span className="flair">{flairContentOf(post.linkFlair)}</span>
              )}
              <p className="meta-row">
                <span>Views: {post.views ?? 0}</span>
                <span>Comments: {Array.isArray(post.comments) ? post.comments.length : 0}</span>
                <span>Upvotes: {post.upvotes ?? 0}</span>
                <span>Downvotes: {post.downvotes ?? 0}</span>
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

function CommentItem({ comment, user, postId, depth = 0, setMessage, onReload }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  async function vote(voteType) {
    try {
      await api.voteComment(comment._id, voteType);
      await onReload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitReply(event) {
    event.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.createComment({
        post: postId,
        parentComment: comment._id,
        content: replyText
      });
      setReplyText("");
      setShowReply(false);
      await onReload();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const sortedReplies = [...replies].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="comment-card" style={{ marginLeft: depth * 24 }}>
      <div className="meta-row">
        <strong>{displayNameOfUser(comment.commentedBy)}</strong>
        <span>{formatDate(comment.createdAt)}</span>
        <span>Up: {comment.upvotes ?? 0}</span>
        <span>Down: {comment.downvotes ?? 0}</span>
      </div>
      <div>{renderTextWithLinks(comment.content)}</div>
      {user && (
        <div className="action-row">
          <button onClick={() => vote("upvote")}>Upvote</button>
          <button onClick={() => vote("downvote")}>Downvote</button>
          <button onClick={() => setShowReply((v) => !v)}>
            {showReply ? "Cancel" : "Reply"}
          </button>
        </div>
      )}
      {showReply && (
        <form onSubmit={submitReply}>
          <textarea
            placeholder="Write a reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
          <button type="submit">Submit reply</button>
        </form>
      )}
      {sortedReplies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          user={user}
          postId={postId}
          depth={depth + 1}
          setMessage={setMessage}
          onReload={onReload}
        />
      ))}
    </div>
  );
}

function PostPage({ user, postId, setView, setMessage, onSuccess }) {
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const loadPost = useCallback(async ({ incrementView = false } = {}) => {
    if (!postId) return;
    try {
      const data = await api.getPost(postId, { incrementView });
      setPost(data.post);
    } catch (error) {
      setMessage(error.message);
    }
  }, [postId, setMessage]);

  useEffect(() => {
    loadPost({ incrementView: true });
  }, [loadPost]);

  async function votePost(voteType) {
    try {
      await api.votePost(postId, voteType);
      onSuccess();
      await loadPost();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    try {
      await api.createComment({
        post: postId,
        content: commentText
      });
      setCommentText("");
      onSuccess();
      await loadPost();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!post) {
    return (
      <main className="card">
        <h1>Post</h1>
        <p>Loading post...</p>
      </main>
    );
  }

  return (
    <main className="card" aria-label="Post Page">
      <h1>{post.title}</h1>
      <p>{renderTextWithLinks(post.content)}</p>
      <p className="meta-row">
        <span>Community: {post.community?.name || "Unknown community"}</span>
        <span>Posted by {displayNameOfUser(post.postedBy)}</span>
        {flairContentOf(post.linkFlair) && <span>Flair: {flairContentOf(post.linkFlair)}</span>}
        <span>Views: {post.views ?? 0}</span>
        <span>Upvotes: {post.upvotes ?? 0}</span>
        <span>Downvotes: {post.downvotes ?? 0}</span>
      </p>
      {user ? (
        <div className="action-row">
          <button onClick={() => votePost("upvote")}>Upvote</button>
          <button onClick={() => votePost("downvote")}>Downvote</button>
        </div>
      ) : (
        <p className="muted">Login to vote or comment.</p>
      )}
      <button onClick={() => setView("home")}>Back Home</button>
      <h2>Comments</h2>
      {user && (
        <form onSubmit={submitComment}>
          <textarea
            placeholder="Write a comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <button type="submit">Add Comment</button>
        </form>
      )}
      <div className="list-column">
        {(post.comments || []).length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          post.comments
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              user={user}
              postId={postId}
              depth={0}
              setMessage={setMessage}
              onReload={loadPost}
            />
            ))
        )}
      </div>
    </main>
  );
}

function ProfilePage({ user, setMessage, refreshToken, onUserRefresh }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) return;
    api
      .getProfileContent(user._id)
      .then((data) => setProfile(data))
      .catch((error) => setMessage(error.message));
  }, [user, setMessage, refreshToken]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api
      .listUsers()
      .then((data) => setUsers(data.users || []))
      .catch((error) => setMessage(error.message));
  }, [user, setMessage, refreshToken]);

  async function deleteUser(targetUser) {
    const ok = window.confirm(`Delete user ${targetUser.displayName}? This cannot be undone.`);
    if (!ok) return;
    try {
      await api.deleteUser(targetUser._id);
      setMessage("User deleted successfully.");
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="card">
        <h1>Guest Profile</h1>
        <p>You are browsing as a guest.</p>
      </main>
    );
  }

  return (
    <main className="card" aria-label="Profile Page">
      <h1>Profile</h1>
      <p><strong>Display name:</strong> {user.displayName}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
      <p><strong>Reputation:</strong> {user.reputation}</p>

      {profile && (
        <>
          <h2>Posts Created</h2>
          {(profile.posts || []).length === 0 ? <p>None</p> : profile.posts.map((post) => <p key={post._id}>{post.title}</p>)}
          <h2>Communities Created</h2>
          {(profile.communities || []).length === 0 ? <p>None</p> : profile.communities.map((community) => <p key={community._id}>{community.name}</p>)}
          <h2>Comments Created</h2>
          {(profile.comments || []).length === 0 ? <p>None</p> : profile.comments.map((comment) => <p key={comment._id}>{comment.content}</p>)}
        </>
      )}

      {user.isAdmin && (
        <>
          <h2>Admin: Non-admin Users</h2>
          <div className="list-column">
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users.map((listedUser) => (
                <div key={listedUser._id} className="row-card">
                  <span>{listedUser.displayName}</span>
                  <span>{listedUser.email}</span>
                  <span>Rep: {listedUser.reputation}</span>
                  <button onClick={() => deleteUser(listedUser)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}

function App() {
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
        <SearchPage
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
        <CommunityPage
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
        <PostPage
          user={user}
          postId={selectedPostId}
          setView={setView}
          setMessage={setMessage}
          onSuccess={refreshData}
        />
      )}
      {view === "profile" && (
        <ProfilePage
          user={user}
          setMessage={setMessage}
          refreshToken={refreshToken}
          onUserRefresh={refreshCurrentUser}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
