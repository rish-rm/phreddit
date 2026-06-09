export default function Welcome({ setView }) {
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
