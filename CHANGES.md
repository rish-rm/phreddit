# Changelog — Portfolio Release

## Security
- **Fixed a critical auth bypass:** the `x-test-user-id` header is now honored only when `NODE_ENV=test` (previously it worked unconditionally, allowing anyone to act as any user in production).
- Session ID regeneration on login (prevents session fixation); registration returns to Welcome before authentication.
- Password length of 8-128 characters (server-validated, enforced in the UI).
- `helmet` security headers; CORS allowlist unchanged; `trust proxy` configurable for hosted deployments.
- `votedBy` lists are not exposed by any API surface, including profile content; responses include only the caller's own `userVote`.

## Backend
- **Voting overhaul:** vote / unvote (toggle) / switch with atomic conditional updates; self-voting blocked; reputation deltas apply and reverse correctly (+5/-10 and ±15 on switch).
- **Pagination + server-side sorting** on `GET /api/posts` (`page`, `limit`, `sort=newest|oldest|active`); Active uses the latest comment across multiple threads and joined-community priority is applied before pagination.
- **Full-text search** now uses the existing MongoDB text indexes on posts and comments (previously unindexed regex scans).
- **Flat comment fetching:** `GET /api/posts/:id` loads comments in one indexed query and builds the tree in memory — thread depth is now unbounded (was silently truncated at depth 4).
- **View counting** moved to `POST /api/posts/:id/view`; `GET` is idempotent.
- **Realtime:** Socket.IO server with `post:<id>` rooms; comment/vote/edit/delete/moderation actions emit `post:updated`.
- **Public profiles:** `GET /api/users/:id/public` (display name, reputation, recent activity; no email).
- Community detail endpoint slimmed (posts now come from the paginated listing); removed duplicate `GET /users/me`; Mongoose `ValidationError` → 400; new compound indexes on posts and comments.
- Cascade user deletion reverses the deleted voter's reputation impact before removing vote records.
- Community/comment/flair length limits, Markdown link rules, and link-flair existence are enforced by the API.
- Benchmark tooling: `bench/seed.js` + `bench/run.js` (autocannon).

## Frontend
- **react-router-dom migration:** real URLs and deep links for home, search (`?q=`), communities, posts, public users, and profile; 404 page; redirect-aware auth pages.
- **Vote UI:** toggleable buttons with pressed state, per-user vote highlighting, disabled state + hint below 50 reputation and on own content.
- **Live post pages** via socket.io-client (auto refetch on remote changes).
- **Markdown rendering** (marked + DOMPurify) for posts, comments, and community descriptions.
- **Comment sorting** (Newest / Top) applied recursively.
- Pagination UI (Load More) on Home, Search, and Community; explicit loading, error, retry, and return states.
- Toast notifications with success/error tones and proper ARIA live regions.
- Focus-trapped ConfirmDialog replaces `window.confirm`; moderation resolutions accept an optional note; profile tabs implement keyboard navigation.
- Public user profile page; usernames link throughout the app.
- Assignment-aligned registration/login, post excerpts, post timestamps, dedicated comment/reply pages, and admin profile defaults.

## Testing & CI
- Integration regression coverage includes registration/login, authorization negatives, vote math, multi-thread Active sorting, cross-page membership ordering, profile privacy, and cascade reputation repair.
- Client unit tests (Vitest + React Testing Library) cover utilities, sorting semantics, listing excerpts, and dialog keyboard behavior.
- Playwright specs follow the assignment's register → login flow and dedicated New Comment page.
- GitHub Actions CI: lint + unit + build, integration tests against a MongoDB service container, and a Playwright e2e job.

## Deployment & Docs
- `render.yaml` blueprint for the API; `vercel.json` verified for SPA deep links; env examples updated (`TRUST_PROXY`, prod cookie settings, `VITE_API_BASE_URL`).
- README, API contract, security policy, MIT license, Dependabot configuration, and agent invariants are aligned with the release.

## Intentionally deferred (documented as future work)
TypeScript migration, cursor-based pagination, Redis-backed rate limiting, multi-document transactions (Atlas), image uploads.
