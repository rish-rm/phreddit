import { useState } from "react";
import { api } from "../api/client.js";

export default function CreateCommunity({ setView, setMessage, onSuccess }) {
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
          <button type="button" onClick={() => setView("home")}>Cancel</button>
        </div>
      </form>
    </main>
  );
}
