# Phreddit

Phreddit is a full-stack Reddit-inspired community forum app. It includes account creation, session-based login, communities, posts, threaded comments, voting, reputation, search, user profiles, and admin tools.

## Features

- Register, log in, log out, and continue as a guest
- Create and join communities
- Create posts with optional link flair
- Search posts by title, content, and comment text
- Sort posts by newest, oldest, and recent activity
- Add threaded comments and replies
- Upvote and downvote posts and comments
- Reputation-based voting restrictions
- User profile pages with created communities, posts, and comments
- Admin user listing and user deletion
- Cascade deletion for users, communities, posts, and comments
- Seed script with demo users, communities, posts, comments, and flairs

## Tech Stack

- React
- Vite
- Express
- MongoDB
- Mongoose
- bcrypt
- express-session
- Playwright
- Node test runner

## Project Structure

```text
phreddit/
├── client/
│   ├── e2e/             # Playwright end-to-end tests
│   ├── public/
│   └── src/
│       ├── api/         # API client wrapper
│       ├── components/  # Reusable UI components
│       ├── pages/       # One module per view
│       ├── utils/       # Formatting and sorting helpers
│       ├── App.jsx      # Root component and view routing
│       ├── main.jsx     # Entry point
│       └── style.css
├── images/              # Architecture diagrams
├── server/
│   ├── middleware/      # Session/auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route handlers
│   ├── tests/           # Unit and integration tests
│   ├── utils/           # Validation, voting, cascade deletes
│   ├── init.js          # Database seed script
│   └── server.js
└── README.md
```

> The client dev server proxies `/api` requests to the backend (see `client/vite.config.js`), so the client needs no environment configuration for local development.

## Prerequisites

- Node.js 20.19 or higher
- npm
- MongoDB running locally at `mongodb://127.0.0.1:27017`

## Setup

Install server dependencies:

```bash
cd server
npm install
```

Optionally copy the example environment file and adjust values:

```bash
cp .env.example .env
```

Initialize the database with an admin account and demo data:

```bash
node init.js admin@example.com adminUser AdminPass123!
```

Start the API server:

```bash
npm start
```

Install client dependencies in a second terminal:

```bash
cd client
npm install
```

Optionally copy the client environment example if your API is not on the default local port:

```bash
cp .env.example .env
```

Start the Vite dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Testing

Run server unit tests:

```bash
cd server
npm run test:unit
```

Run server integration tests:

```bash
cd server
npm run test:int
```

Run the client build:

```bash
cd client
npm run build
```

Run the Playwright test after MongoDB, the server, and the client dev server are running:

```bash
cd client
npm run test:e2e
```

## Demo Accounts

The seed script creates the admin account from the command-line arguments. It also creates demo users with the password `DemoPass123!` so the app has sample content immediately after initialization.

## Environment Variables

Server:

- `MONGO_URI`: MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/phreddit`.
- `PORT`: API port. Defaults to `8000`.
- `SESSION_SECRET`: Express session secret.
- `CLIENT_ORIGIN`: Comma-separated list of allowed client origins. Defaults include local Vite origins.
- `SESSION_COOKIE_SAMESITE`: Session cookie SameSite setting. Defaults to `lax`.
- `SESSION_COOKIE_SECURE`: Set to `true` when serving cookies over HTTPS.
- `JSON_BODY_LIMIT`: Maximum accepted JSON request body size. Defaults to `1mb`.

Client:

- `VITE_API_BASE_URL`: API base URL. Defaults to the current browser host on port `8000`, under `/api`.
