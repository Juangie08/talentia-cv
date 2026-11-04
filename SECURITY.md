# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` (latest) | ✅ |
| Older commits | ❌ |

Talentia is a self-hostable web app. If you run your own instance, you are
responsible for keeping your dependencies, database and API keys up to date.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Use one of these private channels:

1. **GitHub Security Advisories** — the "Report a vulnerability" button in the
   *Security* tab of the repository (preferred).
2. If advisories are unavailable, open a minimal issue asking for a private
   contact channel, without disclosing any details.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (proof of concept if possible).
- Affected routes, files or versions.
- Any suggested fix.

You can expect an acknowledgement within **72 hours** and a status update within
**7 days**. Credit will be given in the release notes unless you prefer to stay
anonymous.

## Scope

In scope:

- Authentication and session handling (`NextAuth`, `src/lib/authOptions.ts`).
- Data isolation between users (saved resumes, profiles, AI usage).
- The AI endpoints (`/api/ai/*`, `/api/improve`) including prompt injection that
  could leak keys or server configuration.
- Server-side request handling in `src/app/api/*`.
- Dependency vulnerabilities with a realistic exploitation path.

Out of scope:

- Issues that require a compromised browser, extension or device.
- Self-XSS and social engineering.
- Missing security headers on someone else's deployment (open an issue instead).

## Handling of secrets

- Provider API keys live only in server-side environment variables and are never
  sent to the browser.
- `.env` files are gitignored; only `.env.example` (with empty values) is
  committed. If you ever commit a key by accident, rotate it immediately.
- The public AI endpoint is rate limited and protected by a daily credit quota
  (`AI_DAILY_CREDITS`, `AI_DAILY_CREDITS_ANON`) so a single visitor cannot drain
  a shared key. If you self-host with a personal key, tighten those values.

## Hardening checklist for self-hosting

- [ ] Restrict who can use the shared AI key (credits per day, IP rate limit).
- [ ] Keep `NEXT_PUBLIC_*` variables free of secrets — they are public by design.
- [ ] Serve the app over HTTPS only.
