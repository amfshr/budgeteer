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

- [ ] `PublicLayout` (minimal top bar, centered content) as a layout route with `<Outlet/>`;
      landing folded into the entry/login page
- [ ] `features/auth/LoginPage` — email form (validation, pending state) →
      `POST /auth/login` → navigate to magic-link-sent view (shows masked email, resend)
- [ ] `features/auth/VerifyPage` — `/auth/verify` route: reads `token` param, calls verify
      with JSON accept, success → `/app`; invalid/expired → clear error + back to login
- [ ] `features/auth/useSession` — TanStack Query hook on `GET /auth/me`
      (`queryKey: ['session']`); exposes user, isPending, signedOut state
- [ ] `RequireAuth` layout route — wraps `/app/**`: pending → spinner, no session →
      redirect `/login`; wire `setUnauthorizedHandler` → router redirect + `['session']`
      cache clear (mid-session expiry)
- [ ] Logout — `POST /auth/logout`, clear query cache, redirect to login
- [ ] Server tweak if needed for SPA verify flow (link target/loginSuccessUrl) + OpenAPI
      snapshot regen
- [ ] Tests: LoginPage (submit → sent state), VerifyPage (success + invalid token),
      RequireAuth (redirects), useSession/logout client behaviour
- [ ] Manual E2E in dev: request link → copy from console → click → land in `/app` →
      refresh (session survives) → logout
- [ ] **Alexander:** re-create Resend account + API key (gates real email, not this ticket;
      needed before #17 daily use)

## Non-goals

- Authenticated chrome/navigation (Session 02), passkeys (post-MVP), rate-limiting UX
  beyond what the server already does
