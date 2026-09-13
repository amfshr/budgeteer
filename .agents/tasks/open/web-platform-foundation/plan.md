# E1 Web Platform Foundation — scaffold `budgeteer-web`

> **Priority:** 🟡 P2 | **Estimate:** 0.5–1d | **Status:** In Progress
> **Branch:** `feature/web-scaffold` | **Source:** Session 01 decisions 1–5
> ([design-session-01-top-down.md](../../notes/product/design-session-01-top-down.md))

## Goal

Stand up the frontend workspace so every later epic (#14 login, #15 data rights, #16 money
views) starts from a working, tested, CI-guarded app shell instead of a blank folder. Platform
per Session 01: **TypeScript React web app** (Vite), react-bootstrap **mobile-first**,
TanStack Query for server state, React Router, Vitest/RTL — browser-only (Electron retired,
PWA later). No product features in this ticket; the deliverable is the machine that makes
features cheap.

## Scope

- [x] `budgeteer-web/` at repo root: Vite + React + TypeScript scaffold
- [x] Dependencies: `bootstrap` + `react-bootstrap` (mobile-first shell), `@tanstack/react-query`,
      `react-router` — versions pinned, lockfile committed
- [x] Tooling: ESLint + Prettier (flat config), Vitest + React Testing Library
- [x] Vite dev proxy: `/api` → `http://localhost:8080` so session cookies stay same-origin —
      no CORS/SameSite config needed in dev (also noted on the security-headers backlog row)
- [x] App shell: mobile-first layout frame, Router with placeholder routes (entry/login,
      authenticated home), `QueryClientProvider` wired
- [x] API client module: thin fetch wrapper speaking the house `ApiResponse`/`ApiError`
      envelope, `credentials: include`, central 401 handling (contract:
      `ApiAuthenticationEntryPoint` returns 401 + JSON envelope — E0 decision)
- [x] Smoke tests: shell renders + API-client envelope/401 unit tests (Vitest/RTL)
- [x] CI: frontend job in GitHub Actions (setup-node, `npm ci`, lint, test, build) alongside
      the existing Build & Test gates
- [x] Docs: `.agents/context/commands.md` gains the web commands; short `budgeteer-web/README.md`

## Non-goals

- No real pages/features (login UI is #14, views are #16)
- No deploy/Docker/Tunnel work (#17)
- No PWA/service-worker setup (post-MVP per Session 01)
