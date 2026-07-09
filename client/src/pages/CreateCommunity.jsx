import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../api/client.js";

export default function CreateCommunity() {
  const { user, showMessage, refreshData } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  if (!user) {
    return (
      <main className="card">
        <h1>New Community</h1>
        <p>You must be logged in to create communities.</p>
        <button onClick={() => navigate("/home")}>Back Home</button>
      </main>
    );
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await api.createCommunity(form);
      refreshData();
      showMessage("Community created successfully.", "success");
      const newId = data.community?._id;
      navigate(newId ? `/communities/${newId}` : "/home");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  return (
    <main className="card" aria-label="New Community Page">
      <h1>New Community</h1>
      <form onSubmit={submit}>
        <label htmlFor="communityName">Community name*</label>
        <input
          id="communityName"
          placeholder="Community name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <label htmlFor="communityDescription">Description*</label>
        <textarea
          id="communityDescription"
          placeholder="Community description"
          required
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="action-row">
          <button type="submit">Submit</button>
          <button type="button" onClick={() => navigate("/home")}>Cancel</button>
        </div>
      </form>
    </main>
  );
}
