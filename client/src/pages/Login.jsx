import { useState } from "react";
import { api } from "../api/client.js";

export default function Login({ setView, setUser, setMessage }) {
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
