import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function Login({ setUser, showMessage }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await api.login(form);
      setUser(data.user);
      showMessage("Logged in successfully.", "success");
      navigate("/home");
    } catch (error) {
      showMessage(error.message, "error");
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
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword"
          placeholder="Password"
          type="password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <div className="action-row">
          <button type="submit">Login</button>
          <button type="button" onClick={() => navigate("/")}>Back</button>
        </div>
      </form>
    </main>
  );
}
