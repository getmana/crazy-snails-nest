# 0002. Security headers with helmet in the API, CORS left off

- **Date:** 2026-11-24
- **Status:** Accepted

## Context

- Before the first deploy, the API should send the response headers browsers use for
  protection. OWASP's REST Security Cheat Sheet recommends `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: frame-ancestors`, HSTS and a correct `Content-Type` for API
  responses, and says to disable CORS when cross-domain calls aren't expected.
- The frontend (Next.js on Vercel) calls the API only from its server. Its browser code calls
  its own Next.js routes. Browser security headers do nothing on those server-to-server calls.
- Browsers do reach the API directly in three places: photos under `/uploads` (until they
  move to S3 and CloudFront), the API docs page `/api-docs`, and anyone opening a URL by hand.
- `/api-docs` stays public as part of the portfolio. It is rendered by Scalar, which loads its
  bundle from a CDN and starts it with an inline script.
- The API runs on Lightsail behind nginx, which could also set headers.
- Nest 11 has no built-in security headers (`app.useSecurityHeaders()` arrives in v12.1);
  Nest's docs use `helmet` with Express.

## Decision

- `helmet` with its defaults runs first in `main.ts`, so it covers every route.
- `/api-docs` gets its own `script-src`: `'self'`, `'unsafe-inline'` and the exact Scalar
  bundle URL. Everything else in its policy keeps helmet's defaults.
- `/uploads` sends `Cross-Origin-Resource-Policy: cross-origin`, because the photos are public
  and a page on the frontend's origin may load them directly.
- CORS stays off: no `enableCors`, so no `Access-Control-Allow-*` headers.

## Alternatives considered

- **Set the headers in nginx.** No new dependency, and HSTS sits where TLS ends. But the
  config lives outside the repo, nothing tests it, and the headers disappear if the hosting
  changes. Not chosen.
- **No security headers.** Defensible because most traffic is server-to-server, but it leaves
  `/uploads` without `nosniff` and the public docs page without clickjacking protection.
  Rejected.
- **A nonce instead of `'unsafe-inline'` on `/api-docs`.** Scalar accepts a nonce, but
  `apiReference` takes its config once at startup, so the nonce would never change and give no
  protection. A per-request nonce needs a custom handler around Scalar. Not worth it for a static
  page that renders no user content; can be revisited.
- **Hide `/api-docs` in production.** Gives strict headers everywhere, but the docs are part of
  the portfolio. Rejected.
- **Enable CORS for the frontend's origin.** No browser code calls the API, so it would only
  open access that nothing uses. Direct S3 uploads need CORS on the bucket, not on the API.
  Rejected.

## Consequences

- Any new HTML page served by the API gets helmet's strict policy and needs its own exception
  if it loads outside scripts.
- nginx must not set the same headers, or responses carry duplicates.
- The docs page loads Scalar's latest bundle from the CDN at view time; a compromised bundle
  would run on that page. Pinning a version in `API_DOCS_SCRIPT_URL` would narrow that.
- If the browser ever needs to call the API directly, CORS has to be enabled with an explicit
  origin list.
- The `/uploads` exception goes away when photos move to S3 and CloudFront.
