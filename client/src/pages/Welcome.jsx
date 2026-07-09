import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="card" aria-label="Welcome Page">
      <h1>Welcome to Phreddit</h1>
      <p>Choose how you'd like to enter the application.</p>
      <div className="action-row">
        <button onClick={() => navigate("/register")}>Register</button>
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/home")}>Continue as Guest</button>
      </div>
    </main>
  );
}
