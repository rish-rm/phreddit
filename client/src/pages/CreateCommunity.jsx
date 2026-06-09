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
