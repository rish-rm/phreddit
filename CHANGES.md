# Changelog — Portfolio Upgrade

## Security
- **Fixed a critical auth bypass:** the `x-test-user-id` header is now honored only when `NODE_ENV=test` (previously it worked unconditionally, allowing anyone to act as any user in production).
- Session ID regeneration on login and registration (prevents session fixation).
- Minimum password length of 8 characters (server-validated, enforced in the UI).
- `helmet` security headers; CORS allowlist unchanged; `trust proxy` configurable for hosted deployments.
- `votedBy` lists are no longer exposed by the API; responses include only the caller's own `userVote`.

## Backend
- **Voting overhaul:** vote / unvote (toggle) / switch with atomic conditional updates; self-voting blocked; reputation deltas apply and reverse correctly (+5/-10 and ±15 on switch).
- **Pagination + server-side sorting** on `GET /api/posts` (`page`, `limit`, `sort=newest|oldest|active`); "active" is computed in an aggregation pipeline. Response: `{ posts, page, limit, total, hasMore, sort }`.
- **Full-text search** now uses the existing MongoDB text indexes on posts and comments (previously unindexed regex scans).
- **Flat comment fetching:** `GET /api/posts/:id` loads comments in one indexed query and builds the tree in memory — thread depth is now unbounded (was silently truncated at depth 4).
- **View counting** moved to `POST /api/posts/:id/view`; `GET` is idempotent.
- **Realtime:** Socket.IO server with `post:<id>` rooms; comment/vote/edit/delete/moderation actions emit `post:updated`.
- **Public profiles:** `GET /api/users/:id/public` (display name, reputation, recent activity; no email).
- Community detail endpoint slimmed (posts now come from the paginated listing); removed duplicate `GET /users/me`; Mongoose `ValidationError` → 400; new compound indexes on posts and comments.
- Registration now logs the new account in (returns a session).
- Benchmark tooling: `bench/seed.js` + `bench/run.js` (autocannon).

## Frontend
- **react-router-dom migration:** real URLs and deep links for home, search (`?q=`), communities, posts, public users, and profile; 404 page; redirect-aware auth pages.
- **Vote UI:** toggleable buttons with pressed state, per-user vote highlighting, disabled state + hint below 50 reputation and on own content.
- **Live post pages** via socket.io-client (auto refetch on remote changes).
- **Markdown rendering** (marked + DOMPurify) for posts, comments, and community descriptions.
- **Comment sorting** (Newest / Top) applied recursively.
- Pagination UI (Load More) on Home, Search, and Community; loading, error, and retry states.
- Toast notifications with success/error tones and proper ARIA live regions.
- Accessible ConfirmDialog replaces `window.confirm`; moderation resolutions accept an optional note.
- Public user profile page; usernames link throughout the app.
- Registration auto-login; `required`/`minLength` on auth forms; proper date pluralization.

## Testing & CI
- New integration suites: auth flow (register auto-login, logout, login), authorization negatives, vote toggle + reputation math, pagination/sorting/search, public profiles; view-count test updated to the new semantics.
- Client unit tests (Vitest + React Testing Library) for post/comment utilities, date formatting, and SortButtons.
- Playwright specs updated for auto-login, link navigation, post-page landing, vote toggle labels, and the confirm dialog.
- GitHub Actions CI: lint + unit + build, integration tests against a MongoDB service container, and a Playwright e2e job.

## Deployment & Docs
- `render.yaml` blueprint for the API; `vercel.json` verified for SPA deep links; env examples updated (`TRUST_PROXY`, prod cookie settings, `VITE_API_BASE_URL`).
- README rewritten: Express 4 (was mislabeled Express 5), live-demo section, deployment guide (Atlas + Render + Vercel), benchmark how-to, updated architecture notes and talking points.

## Intentionally deferred (documented as future work)
TypeScript migration, cursor-based pagination, Redis-backed rate limiting, multi-document transactions (Atlas), image uploads.
