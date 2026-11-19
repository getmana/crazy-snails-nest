# 0001. Rate limiting: limit visitors at Vercel, trust the frontend server by a shared secret

- **Date:** 2026-11-19
- **Status:** Accepted
- **Flow:** [rate-limiting](../flows/rate-limiting.md)

## Context

- The API needs rate limiting before its first deploy, above all on sign-in, to slow down
  password guessing.
- The deployment is the frontend (Next.js) on Vercel's free Hobby plan and the API on a
  Lightsail instance behind nginx, with Neon as the database.
- The frontend calls the API from its server (route handlers, server actions), not from
  the browser. Vercel runs that server on shared machines whose IP addresses change and
  can't be listed, so the API sees Vercel's addresses, not the visitor's.
- The API must stay reachable from the internet (Vercel has to reach it), so anyone who
  finds its address can call it directly.
- Vercel's firewall offers rate limiting on Hobby: one rule per project, counted per IP.

## Decision

- Visitors are limited by a Vercel firewall rule on the frontend's sign-in route, where
  their real IP is visible.
- The frontend server sends a shared secret header (`X-Frontend-Secret`). The API skips
  all its limits for requests carrying the right secret.
- Every other request is limited by the API itself (`@nestjs/throttler`), per IP: a loose
  global limit and a strict sign-in limit. nginx is trusted for the client IP through
  `TRUST_PROXY=loopback`.

## Alternatives considered

- **The frontend forwards the visitor's IP and the API trusts it.** It works when both apps
  share a machine (`loopback`), but Vercel's changing addresses can't be trusted by IP.
  Trusting a forwarded IP from anyone with a secret would also let a leaked secret fake
  any IP. Rejected.
- **Limit only in Next.js.** Leaves the API's sign-in open to anyone calling it directly.
  It would only work if the API were private, which it can't be with Vercel. Rejected.
- **nginx `limit_req` in front of the API.** All website traffic arrives from Vercel's
  addresses, so nginx can't tell visitors apart. Not needed, since the API limits direct
  callers itself.
- **Limit sign-in per email instead of per IP.** Anyone could lock a user out by
  spamming their email. Rejected.
- **Host both apps on one Lightsail instance.** Makes IP forwarding simple and allows
  nginx `limit_req`, but costs more and means running Next.js ourselves. Not chosen.

## Consequences

- The frontend must send the secret on every server-side call, and the Vercel rule must
  exist, before the API is deployed. Missing either breaks limiting (see the flow's table).
- A leaked secret bypasses rate limiting, not authentication. Rotation means changing it
  on both sides.
- Website traffic other than sign-in relies on Vercel's default DDoS protection, since the
  Hobby plan allows only one rate-limit rule.
- Counters live in the API's memory, which is fine for one instance.
