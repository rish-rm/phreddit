import { useState } from "react";
import { api } from "../api/client.js";

export default function Register({ setView, setMessage }) {
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
        <div className="action-row">
          <button type="submit">Sign Up</button>
          <button type="button" onClick={() => setView("welcome")}>Back</button>
        </div>
      </form>
    </main>
  );
}
