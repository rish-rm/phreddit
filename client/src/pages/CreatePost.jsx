import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function CreatePost({ user, setView, setMessage, onSuccess }) {
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
