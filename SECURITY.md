# Security Policy

## Supported Version

Security fixes are applied to the current `main` branch.

## Reporting a Vulnerability

Please use the repository's private GitHub Security Advisory reporting flow.
Do not publish authentication bypasses, session weaknesses, exposed secrets,
or private-data leaks in a public issue.

Include the affected endpoint or component, reproduction steps, expected and
observed behavior, and any suggested remediation. Reports will be reviewed as
quickly as possible and credited when appropriate.

## Security Boundaries

- Production authentication uses signed server sessions and HTTP-only cookies.
- The `x-test-user-id` header is accepted only when `NODE_ENV=test`.
- User-authored Markdown is sanitized before rendering.
- Post and comment voter lists are private and must pass through the shared
  serializer before entering an API response.
- Production startup requires `SESSION_SECRET`; secrets belong in hosting
  environment variables and must never be committed.
