import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import EditableItemRow from "../components/EditableItemRow.jsx";
import { formatDate } from "../utils/format.jsx";

export default function Profile({ user, setMessage, refreshToken, onUserRefresh, onOpenPost }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [viewedUser, setViewedUser] = useState(null);
  const [editing, setEditing] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  const profileUser = viewedUser || user;

  useEffect(() => {
    if (!profileUser?._id) return;
    api
      .getProfileContent(profileUser._id)
      .then((data) => setProfile(data))
      .catch((error) => setMessage(error.message));
  }, [profileUser?._id, setMessage, refreshToken, localRefresh]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api
      .listUsers()
      .then((data) => setUsers(data.users || []))
      .catch((error) => setMessage(error.message));
  }, [user, setMessage, refreshToken, localRefresh]);

  useEffect(() => {
    if (!user?.isAdmin || viewedUser) return;
    api
      .listReports()
      .then((data) => setReports(data.reports || []))
      .catch((error) => setMessage(error.message));
  }, [user, viewedUser, setMessage, refreshToken, localRefresh]);

  function refresh() {
    setLocalRefresh((n) => n + 1);
  }

  async function deleteUser(targetUser) {
    const ok = window.confirm(
      `Delete user ${targetUser.displayName}? All of their communities, posts, and comments will also be deleted. This cannot be undone.`
    );
    if (!ok) return;
    try {
      await api.deleteUser(targetUser._id);
      setMessage("User deleted successfully.");
      if (viewedUser?._id === targetUser._id) setViewedUser(null);
      refresh();
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(kind, item) {
    const label =
      kind === "post" ? `post "${item.title}"` :
      kind === "community" ? `community "${item.name}" (its posts and comments will also be deleted)` :
      "comment";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      if (kind === "post") await api.deletePost(item._id);
      else if (kind === "community") await api.deleteCommunity(item._id);
      else await api.deleteComment(item._id);
      setMessage(`${kind[0].toUpperCase() + kind.slice(1)} deleted successfully.`);
      refresh();
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      if (editing.kind === "post") {
        await api.updatePost(editing.item._id, {
          title: form.get("title"),
          content: form.get("content")
        });
      } else if (editing.kind === "community") {
        await api.updateCommunity(editing.item._id, {
          name: form.get("name"),
          description: form.get("description")
        });
      } else {
        await api.updateComment(editing.item._id, {
          content: form.get("content")
        });
      }
      setMessage(`${editing.kind[0].toUpperCase() + editing.kind.slice(1)} updated successfully.`);
      setEditing(null);
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeSavedPost(post) {
    try {
      await api.unsavePost(post._id);
      setMessage("Post removed from saved posts.");
      refresh();
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function resolveReport(report, action) {
    if (
      action === "delete_post" &&
      !window.confirm(`Delete reported post "${report.targetPost?.title || "removed post"}"?`)
    ) {
      return;
    }

    try {
      const data = await api.resolveReport(report._id, { action });
      setReports(data.reports || []);
      setMessage(data.message);
      refresh();
      onUserRefresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="card">
        <h1>Guest Profile</h1>
        <p>You are browsing as a guest. Log in to see your profile.</p>
      </main>
    );
  }

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "saved", label: "Saved" },
    { id: "communities", label: "Communities" },
    { id: "comments", label: "Comments" },
    ...(user.isAdmin && !viewedUser ? [{ id: "moderation", label: "Moderation" }] : []),
    ...(user.isAdmin && !viewedUser ? [{ id: "users", label: "Users" }] : [])
  ];

  return (
    <main className="card" aria-label="Profile Page">
      {viewedUser && (
        <button onClick={() => { setViewedUser(null); setActiveTab("posts"); }}>
          Back to your admin profile
        </button>
      )}
      <h1>{viewedUser ? `${viewedUser.displayName}'s Profile` : "Profile"}</h1>
      <p><strong>Display name:</strong> {profileUser.displayName}</p>
      <p><strong>Email:</strong> {profileUser.email}</p>
      <p><strong>Member since:</strong> {formatDate(profileUser.createdAt)}</p>
      <p><strong>Reputation:</strong> {profileUser.reputation}</p>

      <div className="tab-row" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {editing && (
        <form className="edit-form" onSubmit={submitEdit}>
          <h3>Edit {editing.kind}</h3>
          {editing.kind === "post" && (
            <>
              <label>Title<input name="title" defaultValue={editing.item.title} required maxLength={100} /></label>
              <label>Content<textarea name="content" defaultValue={editing.item.content} required /></label>
            </>
          )}
          {editing.kind === "community" && (
            <>
              <label>Name<input name="name" defaultValue={editing.item.name} required /></label>
              <label>Description<textarea name="description" defaultValue={editing.item.description} required /></label>
            </>
          )}
          {editing.kind === "comment" && (
            <label>Content<textarea name="content" defaultValue={editing.item.content} required /></label>
          )}
          <div className="row-card-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {activeTab === "posts" && (
        <div className="list-column">
          {(profile?.posts || []).length === 0 ? <p>No posts yet.</p> :
            profile.posts.map((post) => (
              <EditableItemRow
                key={post._id}
                title={post.title}
                subtitle={post.community?.name ? `in ${post.community.name}` : ""}
                onEdit={() => setEditing({ kind: "post", item: post })}
                onDelete={() => handleDelete("post", post)}
              />
            ))}
        </div>
      )}

      {activeTab === "communities" && (
        <div className="list-column">
          {(profile?.communities || []).length === 0 ? <p>No communities yet.</p> :
            profile.communities.map((community) => (
              <EditableItemRow
                key={community._id}
                title={community.name}
                subtitle={community.description}
                onEdit={() => setEditing({ kind: "community", item: community })}
                onDelete={() => handleDelete("community", community)}
              />
            ))}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="list-column">
          {(profile?.savedPosts || []).length === 0 ? <p>No saved posts yet.</p> :
            profile.savedPosts.map((post) => (
              <div key={post._id} className="row-card">
                <div className="row-card-text">
                  <span className="row-card-title">{post.title}</span>
                  <span className="row-card-subtitle">
                    {post.community?.name ? `in ${post.community.name}` : "Saved post"} | Comments: {post.commentCount ?? 0}
                  </span>
                </div>
                <div className="row-card-actions">
                  <button onClick={() => onOpenPost(post._id)}>Open</button>
                  {String(profileUser._id) === String(user._id) && (
                    <button onClick={() => removeSavedPost(post)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="list-column">
          {(profile?.comments || []).length === 0 ? <p>No comments yet.</p> :
            profile.comments.map((comment) => (
              <EditableItemRow
                key={comment._id}
                title={comment.content.length > 80 ? `${comment.content.slice(0, 80)}...` : comment.content}
                subtitle={comment.post?.title ? `on "${comment.post.title}"` : ""}
                onEdit={() => setEditing({ kind: "comment", item: comment })}
                onDelete={() => handleDelete("comment", comment)}
              />
            ))}
        </div>
      )}

      {activeTab === "users" && user.isAdmin && !viewedUser && (
        <div className="list-column">
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((listedUser) => (
              <div key={listedUser._id} className="row-card">
                <div className="row-card-text">
                  <span className="row-card-title">{listedUser.displayName}</span>
                  <span className="row-card-subtitle">{listedUser.email} | Rep: {listedUser.reputation}</span>
                </div>
                <div className="row-card-actions">
                  <button onClick={() => { setViewedUser(listedUser); setActiveTab("posts"); }}>Act as user</button>
                  <button className="danger" onClick={() => deleteUser(listedUser)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "moderation" && user.isAdmin && !viewedUser && (
        <div className="list-column">
          {reports.length === 0 ? (
            <p>No pending reports.</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="row-card moderation-card">
                <div className="row-card-text">
                  <span className="row-card-title">{report.targetPost?.title || "Removed post"}</span>
                  <span className="row-card-subtitle">
                    {report.reason} report from {report.reportedBy?.displayName || "Unknown user"}
                    {report.targetPost?.community?.name ? ` in ${report.targetPost.community.name}` : ""}
                  </span>
                  {report.details && <span className="row-card-subtitle">{report.details}</span>}
                </div>
                <div className="row-card-actions">
                  {report.targetPost && (
                    <button onClick={() => onOpenPost(report.targetPost._id)}>Open</button>
                  )}
                  <button onClick={() => resolveReport(report, "dismiss")}>Dismiss</button>
                  <button className="danger" onClick={() => resolveReport(report, "delete_post")}>Delete post</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
