# E2 Real Login — magic-link auth end to end

> **Priority:** 🟡 P2 | **Estimate:** 1–2d | **Status:** In Progress
> **Branch:** `feature/real-login` | **Source:** Session 01 dec 6–8, 19
> Scope guard: **public shell only** — authenticated chrome waits for Design Session 02
> (notes/web/03 §1a). `/app` stays a placeholder.

## Goal

A real user (Alexander, phone or laptop) can sign in to Budgeteer with just an email:
request a magic link, click it, land authenticated, stay signed in across the app, and log
out. Signup is the same flow (server find-or-creates on first login). Everything the
authenticated epics (#15/#16) need — session hook, route guard, 401 redirect — exists after
this ticket.

## Server reality (read before building — mostly already there)

- `POST /api/v1/auth/login` — request magic link; dev logs the link to console
  (`app.email-enabled=false`), so no Resend needed to build/test
- `GET /api/v1/auth/verify?token=` — **content-negotiates**: browser → 302 to
  loginSuccessUrl + cookies; `Accept: application/json` → JSON + cookies.
  ⚠️ Decide the SPA flow here: emailed link should target a FRONTEND route
  (`/auth/verify?token=`) which calls the API with `Accept: application/json` (same-origin
  via proxy, cookies land) then navigates to `/app` — check `app.base-url` /
  loginSuccessUrl config and where EmailService builds the link; small server config/tweak
  may be needed → regenerate OpenAPI snapshot if any contract change
- `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` — exist
- Sessions: HttpOnly JWE cookies, single-session policy, 401 envelope on expiry

## Scope

- [x] `PublicLayout` (minimal top bar, centered content) as a layout route with `<Outlet/>`;
      landing folded into the entry/login page
- [x] `features/auth/LoginPage` — email form (validation, pending state) →
      `POST /auth/login` → navigate to magic-link-sent view (shows masked email, resend)
- [x] `features/auth/VerifyPage` — `/auth/verify` route: reads `token` param, calls verify
      with JSON accept, success → `/app`; invalid/expired → clear error + back to login
- [x] `features/auth/useSession` — TanStack Query hook on `GET /auth/me`
      (`queryKey: ['session']`); exposes user, isPending, signedOut state
- [x] `RequireAuth` layout route — wraps `/app/**`: pending → spinner, no session →
      redirect `/login`; wire `setUnauthorizedHandler` → router redirect + `['session']`
      cache clear (mid-session expiry)
- [x] Logout — `POST /auth/logout`, clear query cache, redirect to login
- [x] Server tweak if needed for SPA verify flow (link target/loginSuccessUrl) + OpenAPI
      snapshot regen
- [x] Tests: LoginPage (submit → sent state), VerifyPage (success + invalid token),
      RequireAuth (redirects), useSession/logout client behaviour
- [x] Manual E2E (Alexander, 2026-09-15): real email → inbox → link → `/app` → logout — PASSED
      (via two live-found fixes: proxy Origin-header removal for the CORS 403, friendly
      fallback for non-envelope errors)
- [x] **Alexander:** re-create Resend account + API key — DONE 2026-09-13, live delivery
      verified

## Non-goals

- Authenticated chrome/navigation (Session 02), passkeys (post-MVP), rate-limiting UX
  beyond what the server already does


## Found & fixed during the build (2026-09-15)

- **Email failure was a raw 500** — a `MailException` bubbled as `RuntimeException` →
  generic INTERNAL_ERROR envelope. Now `ApiException(EMAIL_SERVICE_ERROR)` (502) with an
  actionable message the login form renders directly. (Surfaced live: `.env` still has
  `APP_EMAIL_ENABLED=true` from the Resend test, and Resend 550s `example.com` recipients.)
- **SPA verify flow settled**: emailed link now targets `{base-url}/auth/verify?token=`
  (frontend route); dev `.env` `APP_BASE_URL` → `http://localhost:5173`. Semantics: base-url
  = "the origin users see" (single public domain in prod). Backend content-negotiation kept.
- **Observation (accepted trade-off, no change)**: after logout, the *access* JWE remains
  cryptographically valid until expiry — logout revokes the refresh session and clears
  cookies (so browsers are fine), but a captured access token works for ≤ its TTL. Standard
  stateless-token revocation gap; bounded by the short access expiry.

## Server-side E2E verified (curl, 2026-09-15)

login → console link targets `:5173/auth/verify?token=…` → verify (JSON) sets cookies →
`/me` returns the user → logout → refresh session revoked. Browser E2E = Alexander's manual
pass with `npm run dev`.

## Late addition (2026-09-15): HTML magic-link email

Proton (and most clients) won't linkify plain-text localhost URLs — the email is now
multipart/alternative: HTML part with a real sign-in button + printed URL, text/plain
fallback. Expiry text now comes from `JweProperties.getMagicLinkExpiry()` (was hardcoded
"15 minutes" — wrong in every env: dev=30m, prod=10m). EmailServiceTest reworked around a
real in-memory MimeMessage (10 tests). Micro-nit left open: MagicLinkSentPage hardcodes
"30 minutes" — fine for dev, wrong for prod's 10m; revisit when frontend reads config.
