import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="card" aria-label="Not Found Page">
      <h1>Page not found</h1>
      <p>The page you were looking for does not exist.</p>
      <Link className="inline-link" to="/home">Back to Home</Link>
    </main>
  );
}
