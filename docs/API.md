# Phreddit API

All endpoints are rooted at `/api`. Browser requests use a signed, HTTP-only
session cookie. JSON errors have the shape `{ "error": "message" }`; registration
validation may return `{ "errors": ["message"] }`.

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account; does not start a session |
| POST | `/auth/login` | Public | Regenerate the session and authenticate |
| POST | `/auth/logout` | Public | Destroy the current session |
| GET | `/auth/me` | Public | Return the current user or `null` |

## Communities and Discovery

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/communities` | Public | Lightweight community summaries, joined first |
| GET | `/communities/:id` | Public | Community details |
| POST | `/communities` | User | Create a community |
| PUT/DELETE | `/communities/:id` | Owner/Admin | Edit or cascade-delete |
| POST | `/communities/:id/join` | User | Join a community |
| POST | `/communities/:id/leave` | User | Leave a community |
| GET | `/linkflairs` | Public | List link flairs |
| POST | `/linkflairs` | User | Create a unique link flair |

## Posts and Comments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/posts` | Public | Paginated listing/search/filter/sort |
| GET | `/posts/:id` | Public | Post plus an unbounded comment tree |
| POST | `/posts/:id/view` | Public | Atomically increment views |
| POST | `/posts` | User | Create a post |
| PUT/DELETE | `/posts/:id` | Owner/Admin | Edit or cascade-delete |
| POST | `/posts/:id/vote` | Eligible user | Add, remove, or switch a vote |
| POST | `/comments` | User | Create a comment or reply |
| PUT/DELETE | `/comments/:id` | Owner/Admin | Edit or cascade-delete |
| POST | `/comments/:id/vote` | Eligible user | Add, remove, or switch a vote |

`GET /posts` accepts `page`, `limit`, `sort=newest|oldest|active`, `community`,
`linkFlair`, and `search`. Authenticated feeds prioritize joined communities
before applying page boundaries. Vote histories are never serialized; responses
contain only `userVote` for the caller.

## Profiles and Moderation

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/:id/public` | Public | Safe public profile and recent activity |
| GET | `/users/:id/profile-content` | Self/Admin | Editable profile content |
| GET | `/users` | Admin | User-management listing |
| DELETE | `/users/:id` | Admin | Cascade-delete a non-admin account |
| POST/DELETE | `/users/me/saved-posts/:postId` | User | Save or unsave a post |
| POST | `/reports/posts/:postId` | User | Report a post once while pending |
| GET | `/reports` | Admin | Moderation queue |
| POST | `/reports/:id/resolve` | Admin | Dismiss or remove reported content |

State-changing post/comment operations emit `post:updated` to the corresponding
Socket.IO `post:<id>` room. The client treats these events as invalidations and
refetches authoritative API state.
