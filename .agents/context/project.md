# Project Status

## What It Is

Budgeteer is a personal finance app: a Spring Boot API that syncs with Monzo (OAuth,
encrypted tokens, full-history backfill + hourly delta into a provider-agnostic domain
model) and a React SPA (`budgeteer-web/`) with real login and live money views.
Solo project by @amfshr.

## Current Phase (September 2026) — the frontend era

The backend platform (auth, Monzo sync, raw→domain ingest, read APIs) is done; work now
runs frontend-first through the Session-01/02 epics. Shipped in order: **#13** web
scaffold (Vite 8 / React 19 / TS strict / Tailwind v4 + shadcn/ui / TanStack Query /
Router v7), **OpenAPI contract** (springdoc snapshot → generated TS types), **#14** real
login (magic link end-to-end, HttpOnly JWE cookies, single-session), **#16** money views
(accounts/balances/transactions/spend summaries + first-connect onboarding with live
progress), **#18** views polish & app shell (bottom tabs / top nav, dashboard v1 blocks,
design pass: palette 3e ink-first, brand kit, branded email — PR #97).

Product direction lives in the three design-session docs
(`.agents/notes/product/design-session-0{1,2,3}-*.md`, decisions 1–43) and the design
canvas (vendored at `.agents/notes/product/design/`; readable/writable live via the
DesignSync tool, project 69558837…). Session 03 (2026-09-21) designed the supporting
views: landing (5c split door), full auth state map + passkeys (6a–6h), widget frame
contract + bento layout (7a–7e, customize parked), settings deep pass (8a–8g). Money model decided: pots =
exclusive folders in a tree with rollups; labels = free tags; conservation invariant §2a.

## Next (the board is authoritative: `.agents/tasks/tasks.md`)

1. **#19 Pots, targets & labels** — `/grill-me` first; UI already designed (canvas 2a–2c)
2. **#15 Settings & data rights** (grill first; canvas 4a–4e + 8a–8g; grill decides
   single- vs multi-session — see dec 41) → **#17 edge & deploy** (Cloudflare Tunnel +
   Access, one URL) → **auth v2 phase 1** (nonce cookie + email OTP; never passwords;
   designs: canvas 6a–6h)
3. Before #17: per-request session validation (DECIDED 2026-09-20 — drops pure
   statelessness) and login rate-limiting
4. Parallel-friendly: pending-fossil stopgap (P2) — id-based delta never re-fetches
   updates, so pending→settled statuses fossilise until webhooks (#5)

## Completed (chronological)

- [x] Platform: CI/CD, CodeQL, Checkstyle, Dependabot, branch protection, PG16 + Flyway (V1–V13)
- [x] Auth: magic links (hashed, single-use, 15 min), JWE cookies (15m/7d), single-session policy
- [x] Monzo: OAuth (DB-backed state), AES-256-GCM token storage, auto-refresh, windowed
      backfill (SCA-resumable) + hourly delta, sync progress endpoint
- [x] Multi-module reactor: `provider-api` / `provider-monzo` / `budgeteer-server`
      (capability contracts, PSD2 vocabulary, sealed `SyncPosition`)
- [x] #11 domain model: raw→domain ingest (`bank_accounts`/`transactions`), read APIs
      (accounts, summaries, paged transactions), 654+ tests (PR #87)
- [x] #13/#14/#16/#18 frontend epics + OpenAPI contract (PRs #92–#97)
- [x] Brand: b-mark icon set, wordmark, branded magic-link email (design canvas dec 33/34)
- [x] Test suite: 526 unit + 133 integration (server) + 39 web tests

## Key Docs

> Full docs index: `docs/README.md` · shared agent state: `.agents/`

- `.agents/tasks/tasks.md` — the board (single source of truth for what's next)
- `.agents/notes/product/` — design sessions, user stories, design canvas
- `docs/api/openapi.json` — committed API contract (regenerate via script on API change)
- `docs/brand/` — brand marks + regeneration notes
