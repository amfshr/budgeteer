# Design Session 01 — Top-Down Product View

> **Branch:** `docs/product-design-investigation` (off `main`) | **Started:** 2026-09-11
> **Mode:** investigation/design — no code. Output feeds the task board.
>
> Working shape: Alexander brain-dumps user stories + the views he wants → Claude structures,
> challenges, and maps them to what the backend can already serve → gaps become candidate
> slices with rough ordering. Related prior thinking: `.agents/notes/domain-model-design.md`
> (slices 2–5 build order: categories → budgets → reports → virtual pots).

---

## 1. Why now (Alexander, 2026-09-11)

- **TrueLayer/Lloyds is deprioritised** — not integrating a second provider before there's a
  frontend, real login functionality, security, and basic features in place.
- **The frontend is the missing forcing function**: the best way to model the internal domain
  and the Budgeteer API is to start building the thing that consumes it, not to speculate.
- **Feature-light, demand-driven**: build APIs as they're *actually* needed by real screens,
  instead of second-guessing the entire app and "completing" the backend first.
- Therefore: user stories + real use cases + pages/views now → get the app up and running →
  grow functionality slice by slice until happy.

**Strategy implications to test in this session:**
- Queue reorder: frontend work moves ahead of #5 webhooks and TrueLayer (board currently says
  #5 → TrueLayer after #11). Webhooks' near-real-time value is invisible without a UI anyway.
- **Login has a dead dependency**: magic-link email currently has no sender (Resend account
  deleted, config left pending Resend-vs-Proton). A real login flow forces that decision.
- Frontend framework is board-TBD (React/Vue/HTMX) — this session's views should inform it.
- The PR #87 API-shape review items (DTO enums, `api/v1` packaging, layering) gain urgency:
  settle the contract *before* the first real consumer builds against it.
- Deferred-until-frontend items become live: security headers, Vite `/api` proxy (see
  `.agents/memory.md` frontend-phase note), CORS posture.

## 1b. Grill decisions log (running)

| # | Branch | Decision | Rationale | Rejected alternative |
|---|--------|----------|-----------|----------------------|
| 1 | A | **TypeScript** for `budgeteer-web` | Types mirror the API DTOs — contract drift breaks the build, not the runtime; natural fit for a Java dev | JavaScript (loses compile-time API safety) |
| 2 | A | **Web-first; Electron deferred indefinitely** | No desktop-only need exists; Electron forces a second auth architecture (non-cookie, non-browser-SSO) for zero capability. PWA install remains a later free upgrade | Electron from day one (rejected: auth complexity before any feature); PWA-now (deferred, additive later) |
| 3 | A | **react-bootstrap**, mobile-first | Familiarity beats marginal ergonomics solo; Bootstrap is mobile-first by design. Known cost: default look until themed | Mantine/MUI (richer tables/pickers), Tailwind (bespoke control, more work) |
| 4 | A | Defaults accepted without grilling: **Vite**, same-repo `budgeteer-web/`, React | Half-decided in repo already (dir exists, Vite proxy note in memory); React mainstream + huge ecosystem | Separate repo; Vue/HTMX (board TBD now resolved) |

| 5 | A | Defaults accepted: **TanStack Query** (server state), **React Router**, **Vitest+RTL** (Playwright post-login), ESLint+Prettier in CI | The app is mostly fetch/cache/refetch of server data; no global-state lib until a real need | Redux et al. (no demonstrated need) |
| 6 | B | **Re-create Resend** on the product domain to unblock magic-link email | Existing EmailService config targets Resend → zero code change; free tier covers the volume; keeps product mail out of personal Proton | Proton SMTP (paid plan + config change, mixes estates) |
| 7 | B | **Email-only registration** stays | Data minimisation = best GDPR posture + least friction; can't leak what you never collected. Optional display name later in settings | Collecting name at signup |
| 8 | B | **Passkeys post-MVP** as fast re-auth; magic link remains registration + recovery | Prove the loop first; WebAuthn server work off the critical path | Passkeys in first auth build; magic-link-only forever |

| 9 | C | **MVP settings controls: Delete account + purge, Export my data (JSON), Disconnect Monzo** | Self-service erasure is table stakes (Art. 17/20 made real in-app); export is cheap on existing reads; disconnect mostly exists server-side | Deactivate (reversible) — deferred, extra state machine for unproven need |
| 10 | C | **Delete = instant + irreversible, typed confirmation**; cascades DB (FKs already ON DELETE CASCADE), revokes Monzo consent, kills sessions | Honest and simple; no zombie-data window; no support desk to need a grace period | 7-day grace (scheduled purge job + zombie state to secure) |
| 11 | C | **Personal/household use only** — recorded line: serving account data beyond the household ⇒ ICO registration + FCA AISP questions before doing it | Domestic exemption keeps posture light now; the line is written down, not discovered later | Designing multi-user compliance now (overhead for a hypothetical) |
| 12 | C | **Encryption inventory deliberate**: tokens + raw JSON encrypted; domain rows + email plaintext in Postgres, protected by NUC full-disk encryption + network posture | Field-level encryption of domain data would kill the SQL powering summaries/filters | Encrypt-everything (unqueryable) |

| 13 | D | **Cloudflare Tunnel** — cloudflared dials out from the NUC; app binds localhost; zero open router ports | Origin unreachable except via Cloudflare by construction | DNS-proxy + port-forward (open port, origin validation needed) |
| 14 | D | **Cloudflare Access identity allowlist** in front of app auth (email OTP/SSO, just Alexander) | App invisible to the internet; drive-by surface removed; app magic-link remains second independent layer | App-auth-only exposure (24/7 public login page + API) |
| 15 | D | **One URL through Cloudflare everywhere**, incl. at home; LAN-direct = break-glass only | Uniform TLS/cookies/auth on every device/network; hairpin cost irrelevant at this volume | Split-horizon DNS (two paths to keep consistent) |
| 16 | D | Retired by decision 2: desktop bearer-token/mTLS/CA design. If a non-browser client ever exists → Cloudflare Access **service tokens** | No non-browser client planned | — |
| 17 | D | ⚠️ Future note for #5: **webhooks can't pass Access** — Monzo's servers will need a deliberate bypass route with its own verification (signature/secret) when webhooks are built | Recorded now so the Access decision doesn't silently break #5 later | — |

| 18 | E | **Dashboard v1 = fixed composition** (balances + today/week summary + recent transactions — all served by existing APIs), built component-wise so the customisable widget dashboard can layer on later as its own epic | Feature-light: prove the loop before building a widget engine; his widget vision recorded in §2 for Session 02 | Widget/customisable dashboard first (engine before evidence) |
| 19 | E | **Landing folds into a polished login/entry page** | Behind Access there is no anonymous audience; effort goes to the dashboard | Separate marketing-style landing (revisit only if a public face is ever wanted) |
| 20 | E | **Transactions view v1 = existing API only** (paged newest-first, account/date filter). Merchant search = first demand-driven API addition when the screen proves it | Grow APIs from real screen needs — his stated strategy | Building search/filter endpoints speculatively |
| 21 | E | **Design Session 02 scheduled**: dedicated user-story/views grill (dashboard composition, transactions jobs, end-of-month review, pots UX) before E4's dashboard build | He explicitly wants a story-exploration session; content decisions parked, not rushed | Deciding dashboard content now on a hunch |

## 2. User stories (first pass, 2026-09-11 — deep-dive deferred to Design Session 02)

Alexander's brain-dump, grouped:

- **Dashboard/summary:** a customisable, growable summary page — pick-and-choose widgets/views
  (Apple dynamic-island-style glanceability). Candidate widgets: daily budget vs spend; daily
  transactions; monthly state; balances per account AND per pot (money box, credit card,
  current account).
- **Pots:** view specific virtual pots and their progress (e.g. "amount saved for motorcycle
  training"); allocate from income ("deduct £x from salary → credit motorcycle savings").
- **Honesty constraint:** whatever is displayed, the real cash across accounts must always
  tot up correctly; virtual structure sits on top, never distorts the real numbers.

**Open (Session 02):** the coffee-question answer (what's first on screen), the transactions
view's day-to-day jobs (search? pending vs settled?), end-of-month review shape, proactive
behaviours (alerts/nudges).

### 2a. Foundational principle — the pot/money consistency rule

Virtual pots are an **overlay ledger over real money**, governed by double-entry semantics:

1. **Real layer is ground truth**: the sum of real account balances is provider-reported fact;
   nothing virtual may alter it.
2. **Every virtual movement is a two-legged transfer** (debit one bucket, credit another) —
   e.g. salary-income bucket −£x / motorcycle-pot +£x. Legs always net to zero.
3. **Conservation invariant**: `Σ pot balances + unallocated = Σ real account balances` (per
   currency). Virtual money is only ever *allocated*, never created or destroyed.
4. **Pots carry explicit debit/credit definitions at creation** — where a pot draws from and
   what it accrues toward is part of the pot's contract, not an afterthought.

> Design consequence when pots are built: a virtual-ledger table of *transfers* (not mutable
> pot balances), an implicit "unallocated" bucket per account/currency, and the invariant
> asserted in tests. This is envelope budgeting done honestly. **Any future pot/budget spec
> must cite this section.**

## 3. Views / screens

<!-- The UI you imagine, top-down: dashboard, account view, transactions view, budgets view...
     Sketch in words or ASCII; fidelity irrelevant. Per view: what data is on it, what actions
     can I take from it? -->

## 4. What the backend serves today (Claude, factual)

Auth & linking:
- Magic-link login (passwordless), JWE session cookies, refresh flow
- Monzo OAuth connect; auto-backfill on connect (full history, SCA-windowed); hourly delta
  sync → ingest → balance refresh chain

Data & reads (`main` + PR #87 pending merge):
- `GET /api/v1/accounts` — bank accounts (provider, type, institution, display name, balance
  snapshot + as-of, archived flag); `includeArchived` toggle
- `GET /api/v1/accounts/{id}/summary` — today / Monday-week / month-to-date in+out sums,
  zone-aware, excludes `excluded_from_analytics`, includes PENDING
- `GET /api/v1/transactions` — paged newest-first; filters: account, half-open `[from,to)`
  date range; amount/currency/status/merchant/notes per row

Storage the API doesn't expose yet:
- `transactions.notes` + `excluded_from_analytics` are user-owned columns (writes not exposed —
  PATCH endpoints deliberately deferred)
- `display_order` on accounts (reorder endpoint deferred)
- Encrypted raw provider JSON per account/transaction (future field-backfill source)

Explicitly NOT built yet (deliberate deferrals):
- Categories / categorisation (slice 2: adds `category_id` + `categories` table)
- Budgets, reports, virtual pots (slices 3–5)
- Webhooks (#5 — near-real-time instead of hourly)
- TrueLayer / multi-bank (backlog)
- Any frontend

## 5. Story → capability mapping (filled during session)

| # | Story | Served today? | Gap / slice |
|---|-------|---------------|-------------|
|   |       |               |             |

## 6. Epics & build order (session output — Alexander to confirm before board sync)

Ordering follows Alexander's stated sequence; each epic is traceable to decisions above.
"Grill?" = needs a `/grill-me` (backend) or Session-02 (product) pass before build.

| # | Epic | Contents | Depends on | Grill? |
|---|------|----------|------------|--------|
| E0 | **API contract close-out** (in flight) | Finish PR #87 review checklist (layering/DTO enums/ZoneId/orchestrator/`api/v1` packaging), merge #11 | his checklist decisions | no — checklist IS the spec |
| E1 | **Web platform foundation** | Scaffold `budgeteer-web`: Vite+TS+React, react-bootstrap, TanStack Query, Router, Vitest/RTL, ESLint+Prettier, Vite `/api` proxy, CI job (decisions 1–5) | — | light spec only |
| E2 | **Real login** | Re-create Resend + verify EmailService (dec 6); entry/login page (landing folded in, dec 19), signup, magic-link-sent + verify handoff, client session handling, logout (dec 7) | E1 | Session-02-lite for page copy/UX; server exists |
| E3 | **Settings & data rights** | Settings page: profile, Disconnect Monzo, Export JSON, Delete+Purge (instant, typed confirm, Monzo consent revoke) — needs new server endpoints (dec 9–10) | E2 | **yes — `/grill-me` the delete/export server spec** |
| E4 | **Money views v1** | Monzo connect flow from client; accounts view; dashboard v1 fixed composition; transactions view v1 (dec 18, 20) — existing APIs | E2; **Session 02 before dashboard build** | Session 02 |
| E5 | **Edge & deploy** | Dockerfile, NUC deploy, Cloudflare Tunnel + Access allowlist, uniform URL, security headers/CSP/CORS (dec 13–15) | E2 (any time after; required before daily phone use) | light spec |
| — | **Later epics (ordered candidates)** | Passkeys (dec 8) → widget dashboard (dec 18) → **pots & budgeting (must cite §2a)** → categorisation → webhooks (**Access bypass, dec 17**) → TrueLayer (board note stands) | evidence from daily use | each gets its own pass |
