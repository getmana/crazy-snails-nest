---
covers:
  - src/config/throttler.config.ts
  - src/app.module.ts
  - src/main.ts
  - src/modules/auth/auth.controller.ts
  - src/constants/index.ts
  - src/constants/error-codes.ts
  - .env.example
  - cs-front: src/api/apiFetch.ts
  - cs-front: src/constants/apiHeaders.ts
  - cs-front: src/constants/apiErrorCodes.ts
  - cs-front: Vercel firewall rule
last-reviewed: 2026-11-24
---

# Rate limiting

How the app stops one client from sending too many requests, mainly to slow down
password guessing on sign-in. Why it's built this way: [decision 0001](../decisions/0001-rate-limiting-trust-frontend-by-secret.md).

> **Status (2026-11-24):** the API side and the frontend code (secret header,
> `TOO_MANY_REQUESTS` and `REGISTRATION_CLOSED` translations) are built. The Vercel firewall
> rule is planned for the first deploy. Without it, sign-in through the website has no limit.

## The big picture

There are two ways to reach the API, and each is limited by the part that can see the
visitor's real IP address.

```
Visitor ──▶ Vercel ──▶ Next.js server ──(secret header)──▶ nginx ──▶ API
            └─ firewall rule:                                       └─ sees the secret,
               limits sign-in per visitor IP                           skips its own limits

Anyone ───────────────────────────────────────────────────▶ nginx ──▶ API
  (calling the API directly)                                        └─ no secret:
                                                                       limits per IP
```

1. **Visitors using the website.** Their requests reach the API through our Next.js
   server on Vercel. Vercel runs that server on shared machines, so to the API every
   visitor would look like the same few Vercel addresses. Counting per IP at the API
   would put all visitors on one counter. So:
   - Vercel's firewall limits sign-in attempts per visitor, before our code runs.
     Vercel can do this because it still sees the visitor's own IP.
   - Our Next.js server proves who it is with a shared secret header, and the API
     doesn't count those requests at all.
2. **Anyone calling the API directly** (a script, an attacker who found the API's
   address). They don't have the secret, so the API limits them itself, per IP:
   a loose limit on every route and a strict one on sign-in.

## How the API knows a caller's IP

On the Lightsail server, nginx sits in front of the API and handles HTTPS. Every request
therefore arrives at the API from nginx (`127.0.0.1`), and nginx passes the real address
in the `X-Forwarded-For` header. Anyone can send that header, so the API believes it only
from addresses listed in `TRUST_PROXY` (on our server: `loopback`, meaning nginx on the
same machine).

## What a limited client sees

HTTP 429 with our usual error body, code `TOO_MANY_REQUESTS`, and a `Retry-After` header
saying how many seconds to wait. The frontend translates the code like any other.

## Setting it up for a deploy

| Where | What |
|---|---|
| API server env | `TRUST_PROXY=loopback`, `FRONTEND_API_SECRET=<random secret>` |
| Vercel env (server-only, never `NEXT_PUBLIC_`) | the same secret, sent by every server-side API call |
| Vercel firewall | one rate-limit rule on the frontend's sign-in route, per IP |

## What goes wrong if a piece is missing

| Missing | Effect |
|---|---|
| `TRUST_PROXY` on the API | Direct callers all look like nginx and share one counter: a few bad sign-ins lock everyone out of direct API access. |
| The secret on either side | The website's traffic is counted as a handful of Vercel IPs: visitors start getting 429s under light load. |
| The Vercel firewall rule | Sign-in through the website has no limit at all, because the API skips our frontend's requests. |
| The secret leaks | Someone can bypass rate limiting (not authentication). Rotate it on both sides. |

## Known limits of this design

- The API keeps its counters in memory: a restart resets them, and a second API instance
  would have its own counters. Fine for one instance; more would need a shared store (Redis).
- The Vercel Hobby plan allows one rate-limit rule per project, so only sign-in is limited there.

## Where it lives in the code

- API limits and the secret check: `createThrottlerOptions` and `isTrustedFrontend` in
  `src/config/throttler.config.ts`; registered in `src/app.module.ts`.
- The stricter sign-in limit: `@Throttle` on `AuthController.signin`.
- Limit values: `RATE_LIMIT_WINDOW_MS`, `DEFAULT_RATE_LIMIT`, `SIGN_IN_RATE_LIMIT` in `src/constants/index.ts`.
- Trusting nginx: `TRUST_PROXY` in `src/main.ts`.
- Frontend: every server-side API call goes through `apiFetch` (`cs-front/src/api/apiFetch.ts`),
  which adds the secret header and logs a warning once if `FRONTEND_API_SECRET` is unset.
- Technical detail: [ARCHITECTURE.md § Rate limiting](../ARCHITECTURE.md#2-bootstrap-and-request-lifecycle).
