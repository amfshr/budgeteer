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

- [ ] **Generated API types** (promised "by #16"): `openapi-typescript` devDep +
      `generate:types` script reading `docs/api/openapi.json` → `src/api/types.gen.ts`;
      accounts/transactions/monzo hooks typed from the contract
- [ ] **features/monzo** — ConnectMonzoCard (shown when no accounts): calls connect,
      `window.location` to the authorization URL; callback server change (browser 302 →
      frontend `/app?connected=1` or similar); post-connect UX
- [ ] **useSyncProgress** (finding #6 contract): poll `sync/progress` with
      `refetchInterval` while backfill runs; progress indicator; on completion invalidate
      `['accounts']` + `['transactions']` so data streams in without manual refresh
- [ ] **features/accounts** — `useAccounts` hook + accounts section: name/institution/type,
      balance via `<Money>`, `balance_as_of` always displayed (balance-snapshot decision)
- [ ] **features/transactions** — `useTransactions` (paged) + transactions view: newest
      first, description/merchant, `<Money>` amounts (sign-aware), created/settled status,
      page controls; optional account filter param
- [ ] **`components/Money.tsx`** — shared formatter: minor units + currency via
      `Intl.NumberFormat`, no arithmetic in components (03 §2 rule)
- [ ] **Routes/nav**: `/app` = overview v0 (accounts + recent transactions, fixed and
      plain), `/app/transactions`; minimal links in AppLayout (no chrome ambition)
- [ ] **Tests**: hooks + pages against envelope fixtures (renderApp pattern); Money
      formatting cases (GBP, negative, zero)
- [ ] **Manual E2E (Alexander)**: tunnel up → connect real Monzo → approve → watch
      progress → accounts + transactions render with real data
- [ ] OpenAPI snapshot regen (callback change) + board/plan close-out

## Non-goals

- Dashboard composition/widgets, branding, chrome (Session 02 owns all three)
- Account summary windows page (API exists; add when a view needs it)
- Prod redirect-URI config (#17 edge work)
