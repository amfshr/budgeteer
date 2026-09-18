# E4 Money Views — functional slice (Monzo connect + basic views)

> **Priority:** 🟡 P2 | **Estimate:** 1.5–2d | **Status:** In Progress
> **Branch:** `feature/money-views` | **Source:** Session 01 dec 18, 20–21 + re-cut 2026-09-15
> Scope guard (Alexander, function before form): REAL DATA on the MINIMAL shell. No visual
> ambition — Design Session 02 happens after this, with these views on screen, and owns
> branding/chrome/dashboard composition. Widget dashboard stays backlog.

## Goal

From a signed-in browser session: connect Monzo, watch the first sync land progressively,
and see real accounts (balances, as-of stamps) and transactions (paged list) in the app.
This is the first time Budgeteer's own frontend shows Budgeteer's own data — and it's the
raw material Design Session 02 designs against.

## Server reality (all read APIs exist — demand-driven gaps only)

- `GET/POST /api/v1/monzo/connect` → authorization URL; `GET /api/v1/monzo/callback` —
  ⚠️ browser lands HERE after Monzo consent (via the tunnel) and currently receives a JSON
  body. Needs the verify-style treatment: browser → 302 to a frontend route; JSON branch
  stays for API clients. Small server change + OpenAPI snapshot regen.
- `GET /api/v1/monzo/sync/progress`, `/status`, `/connections` — backfill visibility
- `GET /api/v1/accounts` (+`includeArchived`), `GET /api/v1/accounts/{id}/summary?zone=`,
  `GET /api/v1/transactions?accountId&from&to&page&size` (PageResponse, newest first)
- Dev reminder: connect needs the ngrok tunnel + Monzo portal redirect URI as before

## Scope

- [x] **Generated API types** (promised "by #16"): `openapi-typescript` devDep +
      `generate:types` script reading `docs/api/openapi.json` → `src/api/types.gen.ts`;
      accounts/transactions/monzo hooks typed from the contract
- [x] **features/monzo** — ConnectMonzoCard (shown when no accounts): calls connect,
      `window.location` to the authorization URL; callback server change (browser 302 →
      frontend `/app?connected=1` or similar); post-connect UX
- [x] **useSyncProgress** (finding #6 contract): poll `sync/progress` with
      `refetchInterval` while backfill runs; progress indicator; on completion invalidate
      `['accounts']` + `['transactions']` so data streams in without manual refresh
- [x] **features/accounts** — `useAccounts` hook + accounts section: name/institution/type,
      balance via `<Money>`, `balance_as_of` always displayed (balance-snapshot decision)
- [x] **features/transactions** — `useTransactions` (paged) + transactions view: newest
      first, description/merchant, `<Money>` amounts (sign-aware), created/settled status,
      page controls; optional account filter param
- [x] **`components/Money.tsx`** — shared formatter: minor units + currency via
      `Intl.NumberFormat`, no arithmetic in components (03 §2 rule)
- [x] **Routes/nav**: `/app` = overview v0 (accounts + recent transactions, fixed and
      plain), `/app/transactions`; minimal links in AppLayout (no chrome ambition)
- [x] **Tests**: hooks + pages against envelope fixtures (renderApp pattern); Money
      formatting cases (GBP, negative, zero)
- [ ] **Manual E2E (Alexander)**: tunnel up → connect real Monzo → approve → watch
      progress → accounts + transactions render with real data
- [x] OpenAPI snapshot regen (callback change) — board/plan close-out after merge

## Non-goals

- Dashboard composition/widgets, branding, chrome (Session 02 owns all three)
- Account summary windows page (API exists; add when a view needs it)
- Prod redirect-URI config (#17 edge work)

## Live E2E findings (2026-09-17)

- **Finding #3 manifested in the wild**: previous dev data belonged to test@example.com;
  Alexander connected as accounts@amfshr.dev → same Monzo account, two app users → first
  owner kept everything, new user saw empty views (isolation working exactly as designed).
  Fixed in dev by surgical psql ownership transfer (raw + domain + connection repoint,
  dead connection deleted); balance refreshed on the new connection. The household epic
  must design real ownership/sharing for this case — tonight is its test scenario.
- **UX note for Session 02 wash-up**: full-page redirect to Monzo felt jarring; iframe is
  impossible (banks send X-Frame-Options: DENY — by design), the legit alternative is a
  popup window (window.open + callback notifies opener + closes). Alexander also has a
  list of view oddities to go over once flows work.
- **Pending statuses fossilise (real pipeline gap, spotted from the first live render)**:
  id-based delta (`since=lastTransactionId`) fetches NEW transactions only — Monzo never
  re-sends updates, so pending→settled transitions stop arriving once backfill windows are
  done (a week of "pending" visible in the UI). Fixes: webhooks #5 (`transaction.updated`)
  or an overlap re-fetch window in the hourly delta (the TrueLayer `FromTime(lastSynced −
  overlap)` pattern applied to Monzo too). Should be scheduled soon — statuses are visibly
  wrong within days.
- **Account display name shows Monzo's internal id** (`user_000...` — their `description`
  for retail accounts, mapped to displayName): prefer a sane label in the UI/mapping when
  displayName looks like an id.
- **Progress/ingest phase gap (live run 2)**: sync/progress reports COMPLETED when the
  BACKFILL ends, but the chained ingest lags (~25s for full history) — the one-shot
  completion refresh fetched empty domain tables and stopped; data landed with no listener
  (Alexander had to navigate away/back). Frontend fix shipped: tail invalidations for ~4
  slow polls (~60s) after completion. Proper fix candidates: progress response includes an
  ingest phase/status, or BackfillCompletedEvent-driven signal (backlog: event-driven
  post-sync hooks). Positive confirmations same run: banner + live counter worked, account
  card appears early via ingestAccounts, fresh statuses settle correctly (fossil issue is
  delta-only).
- **Ghost session after DB wipe (live run 3) — fixed**: a valid stateless JWE whose user
  row no longer exists returned USER_NOT_FOUND **404** from @CurrentUser sites → frontend's
  session cache (which only clears on 401) kept the UI "logged in" while id-only endpoints
  returned empty-200s and /monzo/connect rendered a raw JSON error on navigation. Fix:
  `CurrentUserArgumentResolver` + `/auth/me` now answer **401 NOT_AUTHENTICATED** for
  token-valid-user-missing — dead session, frontend bounces to login automatically.
  This is required groundwork for #15 Delete+Purge (account deletion produces exactly this
  state in prod).

## UX wash-up list for Design Session 02 (Alexander, after the successful full flow)

Flow verdict: works end to end and self-manages, but the experience needs design. Items:
1. Monzo consent presentation: iframe impossible (X-Frame-Options) — the achievable version
   is a POPUP window (app stays put, popup closes on callback).
2. During the post-redirect wait (~5–20s of SCA retries): actively prompt "check your Monzo
   app and approve the push notification" instead of a generic importing banner.
3. **Dedicated connect/onboarding page** (strongest item): e.g. /app/connect — spinner,
   push-approval prompt, progress, green "Monzo sync complete ✓", then reveal the dashboard.
   Calm guided onboarding instead of the dashboard assembling itself; callback redirect
   target is a one-line change; progress endpoint/polling/invalidation machinery reuses
   as-is.
Plus earlier items: account display-name shows Monzo's internal id; general visual polish
throughout (deliberately deferred).
