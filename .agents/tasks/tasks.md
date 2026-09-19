# Budgeteer Task Board

> Kanban index for solo development. Detailed plans live in subfolders — link provided where one exists.
>
> **Legend:** 🚀 In Progress | 📋 Queue | 🗂️ Backlog | ✅ Done | 🧊 Icebox

---

## 🚀 In Progress

| # | Task | Priority | Estimate | Plan |
|---|------|----------|----------|------|
| 18 | 🎨 E6 Views polish & shell — chrome (bottom tabs / top nav), dashboard v1 four-block stack, `/app/connect` onboarding, tx polish set, account-name default; branding tokens after the claude.ai/design pass. Spec = Session 02 decisions 26–32. Branch: `feature/views-polish` | 🟡 P2 | 1.5–2d | [plan](open/views-polish/plan.md) |

---

## 📋 Queue (Next Up)

> **Strategy reset (Design Session 01, 2026-09-11 — see
> [.agents/notes/product/design-session-01-top-down.md](../notes/product/design-session-01-top-down.md)):
> frontend-first, feature-light, demand-driven APIs.** Execution order:
> **#13 ✅ → OpenAPI ✅ → #14 ✅ → #16 (PR #95, awaiting merge) → Design Session 02 ✅
> (2026-09-19 — [notes/product/design-session-02-user-stories.md](../notes/product/design-session-02-user-stories.md),
> decisions 22–32: pots=tree+splits / labels=free tags; bottom-tabs chrome; dashboard v1
> four-block stack; /app/connect onboarding; zinc+emerald calm-precision branding) →
> #18 views polish & shell → #19 pots/targets/labels (**/grill-me first**) → #15 data
> rights → #17 edge/deploy → auth-v2 phase 1**. Webhooks + TrueLayer stay backlog —
> near-real-time sync and a second bank are invisible without the budgeting core. Platform:
> TypeScript React web app (Vite, Tailwind v4 + shadcn/ui — amended from react-bootstrap
> 2026-09-13, TanStack Query), mobile-first,
> browser-only (Electron retired, PWA later); Cloudflare Tunnel + Access in front.

| # | Task | Priority | Estimate | Plan |
|---|------|----------|----------|------|
| 19 | 🏺 E7 Pots, targets & labels — the dec 22/23 model: pot TREE with rollups, amount-splits, free labels, monthly targets, payday config (ST3), month-end remainder (ST5), account nicknames. **Needs `/grill-me` before build** (schema + §2a invariants + dec 22/23 constraints). Absorbs the old "Pots & budgeting" backlog row | 🟡 P2 | 3–4d | [session](../notes/product/design-session-02-user-stories.md) |
| 15 | 🛡️ E3 Settings & data rights — settings page: profile, Disconnect Monzo, Export JSON, **Delete+Purge** (instant, typed confirm, Monzo consent revoke). New server endpoints — **`/grill-me` the delete/export spec before build** (dec 9–12) | 🟡 P2 | 1–2d | [session](../notes/product/design-session-01-top-down.md) |
| 17 | 🌐 E5 Edge & deploy — Dockerfile, NUC deploy, Cloudflare Tunnel + Access identity allowlist, one URL everywhere, security headers/CSP/CORS (dec 13–15). Any time after #14; required before daily phone use | 🟡 P2 | 1–2d | [session](../notes/product/design-session-01-top-down.md) |

---

## 🗂️ Backlog

*Pull into Queue (and create a subfolder) when ready to start.*

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| 📖 Public API docs site (app ↔ docs split) | P3 | 1d | Alexander 2026-09-13 (inspired by Resend + Mintlify/Browserbase docs): Budgeteer as an API-first, integrable product — polished public API reference rendered FROM `docs/api/openapi.json` (the #93 pipeline is the source; enrich with `@Operation` incrementally). Tooling: Mintlify (hosted, lowest effort, the Browserbase look) vs Scalar (self-hosted static renderer, fits one-URL/self-host ethos). Routing: `docs.*` public, app stays behind Cloudflare Access; nav cross-links app ↔ docs. **Reframed 2026-09-13 (late): primary motive is PORTFOLIO/documentation showcase, not third-party integration** — a polished static rendering of the contract needs no auth work at all. PAT auth demoted to only-if-a-real-integrator-appears (YAGNI); if ever: smaller than it sounds: `JweAuthenticationFilter` already resolves `Bearer` before cookie, so PATs are a second credential TYPE through the same filter (pat table + issuance/revocation endpoints + settings UI), not an auth rework. Session tokens can't serve integrations regardless of transport: interactive-only acquisition (magic link) + single-session policy revokes them on every new login (AuthService, by design). ⚠️ Regulatory line from Session 01 holds: documenting/self-hosting is fine — *hosting other people's bank connections* ⇒ ICO/FCA. Slot: after #17 (needs domains/tunnel/Access routing). Related learning interest (Alexander): mTLS/certs — natural home is #17's edge work (Tunnel origin auth, client certs for the NUC) rather than API auth |
| 🩹 Transaction status refresh (pending-fossil fix) | P2 | 0.5d | Found live 2026-09-17 (#16 E2E): id-based hourly delta (`since=lastTransactionId`) fetches NEW transactions only — Monzo never re-sends updates, so pending→settled transitions fossilise once backfill is done (statuses visibly wrong within days). Stopgap fix: hourly job also re-fetches a small overlap window (e.g. last 7d, `FromTime`) — idempotent upsert makes it safe, cursor rules already handle it. Proper fix: webhooks #5 (`transaction.updated`). **Schedule soon — independent of the frontend track, can run parallel to Session 02** |
| 🪝 #5 Webhooks | P3 | TBD | [plan](open/webhooks/plan.md) — second trigger into the raw→domain pipeline + near-real-time balance refresh. **Moved behind frontend epics (Session 01)**; ⚠️ Monzo's servers can't pass Cloudflare Access — needs a deliberate bypass route with its own signature verification (Session 01 dec 17) |
| 🧩 Widget dashboard | P3 | TBD | Customisable pick-and-choose widget summary (Session 01 dec 18 recorded the vision; dashboard v1 ships fixed). Session 02 dec 27: v1 blocks are built widget-shaped — configurability layers on after #19 proves them |
| 📣 Event-driven post-sync hooks | P3 → P2 | 0.5d | [plan](closed/oauth-callback-events/plan.md) — `BackfillCompletedEvent` / `BackfillPausedEvent` + listeners (email, domain mapping, webhook registration). Natural fit alongside #11's `DomainMappingJob`. **Consumer found 2026-09-17**: sync/progress reports COMPLETED when the backfill ends but ingest lags ~25s — the frontend papered over it with tail polling; a BackfillCompleted/IngestCompleted signal (exposed via progress or push) is the proper fix |
| 🏦 TrueLayer Integration (Lloyds/HSBC/Barclays) | P2 | 3–4d | [plan](open/truelayer-integration/plan.md) — add `provider-truelayer` jar as a 2nd implementation of the capability contracts (`ProviderConnectionAuth` + `AccountsCapability`/`BalanceCapability`/`TransactionsCapability`, split in PR #84; cards/standing-orders/direct-debits land as further capability interfaces), copying the `provider-monzo` template from #10. Interface already validated against TrueLayer's Data API in the #6 plan. **Aug 2026 re-check:** Data API still active (now positioned as an "add-on" product — mild vendor-risk signal); Console signup is self-serve, sandbox free, live own-account testing looks viable for a solo dev — **first action when picked up: Console signup + live smoke test (deferred until after #11)**. Token model: 90-day consent, reconfirmation-of-consent renewal, refresh token must be used within a 30-day sliding window. Transactions are date-windowed (`from`/`to`), no page cursor → impl returns null `nextCursor`. ⚠️ plan.md predates the multi-module split (BankAdapter pattern, old paths, V7 migration) — rewrite around the provider contract before build. Provider-contract rename (PR #80) + capability split (PR #84) already executed: jar lands as `provider-truelayer` implementing the capability interfaces. ⚠️ Delta sync: after #12, the fetch start is the sealed `SyncPosition` (`FromTime` \| `AfterTransaction` \| `NextPage`) on `TransactionsCapability.getTransactions` — TrueLayer's impl must switch exhaustively and **throw on `AfterTransaction`** (no id-based deltas). This task must add the time-window delta fallback (`FromTime(last synced − overlap)`, idempotent upserts) incl. the persisted last-synced timestamp (column + migration) and the routing in `TransactionSyncService`. Future payments = separate `PaymentInitiationProvider` interface; one TrueLayer class implements both. **Deprioritised 2026-09-11 (Session 01): sits behind the frontend epics #13–#17 — no second bank before a frontend, real login, and basic features exist** ⚠️ Sync-layer generalisation (Alexander, 2026-08-31): everything in `service/monzo/` that isn't OAuth-specific — `TransactionSyncJob`, `TransactionSyncService`, `TransactionSyncEventListener` + `MonzoConnectionCreatedEvent` — is Monzo-shaped and must generalise here, following the `IngestService`/`ProviderIngestor` orchestrator-plus-strategy pattern from #11 (e.g. generic `ProviderConnectionCreatedEvent(provider, connectionId)` + per-provider sync strategy; listeners out of the monzo subpackage) |
| 🧩 Per-page backfill commits (true mid-window resume) | P3 | 0.5d | Backfill commits one `TransactionTemplate` tx per ≤350-day window; an SCA 403 mid-window rolls the whole window back, so resume re-fetches it. `backfill_progress_cursor` is written per page but rolled back with the window — it never actually resumes mid-window. Commit each page (`REQUIRES_NEW`) so partial progress in a large window survives re-auth. Only bites if a single >90-day-old window can't be pulled within one 5-min SCA budget — low urgency for personal accounts |
| 🧹 api/v1 package reshuffle (by-layer) | P3 | 0.5d | Alexander 2026-09-15: keep the api/{dev,health,v1} top split, but within `v1` the by-resource subpackaging (account/, transaction/, auth/, monzo/ each with dto/ + mapper) is too much — reshuffle to layer packages: `v1/controller`, `v1/resources` (DTOs), `v1/mapper`, maybe `v1/exceptions`. Future backend-refactor slot, not urgent. ⚠️ Consideration for the refactor: mappers are currently package-private-final beside their controllers (E0 layering decision) — a separate mapper package forces them public; decide whether that encapsulation is worth keeping before moving. Mirror the move in test packages |
| 🔌 REST Client Refactoring & Config Consolidation | P2 | 1.5–2d | [plan](closed/rest-client-refactoring/plan.md) — Eliminate config sprawl, create `BankRestClient` base class, organize under `config/clients/` & `config/properties/`. Foundation for TrueLayer. Phase: after transaction sync + webhooks |
| 🚦 Rate-limit magic-link requests | P2 | 0.5d | Alexander's /auth/sent refresh+resend observation (2026-09-15) surfaced the real gap: `POST /api/v1/auth/login` is unauthenticated and unthrottled — email-bombing a victim address / burning Resend quota is free. Add per-email + per-IP throttling (e.g. 3/15min per email, sliding window; 429 + RATE_LIMITED envelope code the login form can render). The sent-page resend behaviour itself is fine (history.state surviving refresh is deliberate; the action equals typing any email on the login page). **Required before #17 internet exposure** |
| 🔄 MonzoClient Resilience | P3 | 0.5d | Connection pooling, timeouts, retries, circuit breaker |
| 🔐 Auth methods v2 (passwordless-first epic) | P2 | 3d | Alexander 2026-09-18, shaped in discussion. **Phase 1 — COMMITTED (rides the post-Session-02 login polish):** same-browser nonce cookie (B, link-forwarding protection) + email OTP code (D, device choice/freedom) — one email carries button AND short code; same-device clicks, cross-device types; mismatch → informative no-session page. **Phase 2 (headline): passkeys** — enrolment in settings (#15 neighbour), passkey-first login, magic-link/OTP fallback+recovery; passkey ≈ phishing-resistant MFA in one gesture. **Phase 3 (only if still wanted after passkeys): TOTP as optional step-up.** **Passwords: NEVER (Alexander 2026-09-18, final)** — reintroducing them is what would force a mandated-2FA ceremony; passwordless-first is the convention — and note Cloudflare Access is already an outer identity gate that can enforce its own MFA. Absorbs the cross-device-handoff icebox row (D solves it) |
| Monitoring Infrastructure | P3 | 0.5d | Prometheus/Grafana on NUC |
| Request Correlation | P3 | 0.25d | Trace IDs to external APIs |
| Architecture Diagrams | P3 | 0.5d | Mermaid diagrams for docs |
| Branch Protection | P2 | 0.5h | GitHub settings |
| 🔒 Remaining Security Headers | P3 | 0.25d | `Referrer-Policy: strict-origin-when-cross-origin` + `Permissions-Policy: camera=(), microphone=(), geolocation=()` — defer until frontend build; also configure Vite proxy (`/api` → `localhost:8080`) to avoid CORS/SameSite issues in dev |

---

## 🧊 Icebox

*Maybe later — not prioritised.*

| Idea | Notes |
|------|-------|
| Session Management Enhancements | Device limits, named sessions |
| Cross-device magic-link handling (convention ladder) | Today = naive: clicking browser gets the session (single-session revokes the other on retry). Standard upgrade ladder discussed 2026-09-18: **(B)** same-browser binding — nonce cookie set at request time, hash stored with the token, verify requires token+cookie; mismatch → informative NO-session page (still behind Access; hardens link-forwarding; small: one cookie+column+page) → **(C)** Slack-style handoff (sent-page polls pending-login id, any-device click approves, ORIGINAL browser gets session) or **(D)** typed short code instead of link (cross-device-correct by construction, cheapest full solution). Do B first when login gets its polish pass; C/D destination. Also: Monzo-consent-finished-on-phone leaves that phone on a login screen — needs a "done, return to your other device" page |
| Race Condition Handling | Optimistic locking for token refresh |
| Mobile App | React Native |
| Budget Alerts | Notifications |
| Spending Predictions | ML |
| Multi-user Support | Admin dashboard |
| Export CSV/PDF | Reports |
| Recurring Payment Detection | Auto-categorisation |
| Custom Category Rules | Rules engine |
| Social OAuth | Google, GitHub login |
| 2FA/MFA | Extra security |

---

## ✅ Done

### September 2026
- [x] **#16 E4 Money Views — functional slice** (PR #95, merged 2026-09-19) — Monzo connect
      from the client (browser-aware callback), sync-progress polling with live counter,
      accounts + transactions views, generated OpenAPI types. Live-proven ×3 against real
      Monzo; five live-found bugs fixed en route (first-connect polling, card/banner overlap,
      ingest-lag tail, ghost-session 401 — #15 groundwork, CORS proxy Origin strip). Findings
      + Session-02 UX wash-up list in [plan](closed/money-views/plan.md)
- [x] **#14 E2 Real Login** (PR #94, merged 2026-09-16) — magic-link auth end to end,
      live-verified by Alexander against a real inbox (Resend → HTML button email → verify →
      session → /app → logout). PublicLayout + minimal AppLayout, LoginPage/Sent/Verify,
      RequireAuth guard, useSession/useLogout, AuthBridge (401 → declarative redirect via
      the session cache). Carried the Tailwind v4 + shadcn/ui stack switch. Live-found
      fixes: Vite proxy strips Origin (same-origin POST 403), email failure typed 502,
      HTML multipart email (Proton wouldn't linkify plain text), expiry text from config.
      CodeQL sensitive-log alert on the dev console link dismissed as by-design (config-
      gated, prod never executes). [plan](closed/real-login/plan.md)
- [x] **#13 E1 Web Platform Foundation** (PR #92, merged 2026-09-13) — `budgeteer-web/`
      scaffolded: Vite 8 + React 19 + TS (strict), react-bootstrap mobile-first (→ amended
      to Tailwind v4 + shadcn/ui later same day, pre-#14), TanStack
      Query, React Router v7, Vitest/RTL (5 smoke tests), ESLint flat + Prettier (template's
      oxlint swapped out), Vite `/api` proxy (same-origin cookies, zero CORS), envelope-aware
      API client with central 401 handling, `Web Lint, Test & Build` CI job. Learning series
      shipped alongside: `.agents/notes/web/01–03`. Authenticated-chrome decision deferred to
      Design Session 02 (03 §1a). [plan](closed/web-platform-foundation/plan.md)
- [x] **OpenAPI contract (springdoc)** (2026-09-13) — `springdoc-openapi-starter-webmvc-ui`
      2.8.6 (runs clean on Boot 4.1), disabled by default + dev-profile-enabled; Swagger UI at
      `/swagger-ui.html`; contract snapshot committed at `docs/api/openapi.json` (23 paths /
      51 schemas incl. dev endpoints — quick-login documented for frontend dev), regenerated
      via `scripts/generate-openapi.sh` (jq-sorted for clean diffs). Follow-ups: drift-check
      IT (spec vs snapshot; needs server-URL normalisation), `openapi-typescript` type-gen
      into `budgeteer-web` by #16. Origin: Alexander — Postman doesn't work as API docs;
      plan sketch `.agents/notes/web/03-frontend-shape.md` §3
- [x] **#11 Domain Model Mapping** (PR #87, merged 2026-09-12, squash `ddd3fd0`) — raw→domain
      ingest pipeline + first product endpoints, built in three reviewed slices (V11 encrypted
      raw capture, V12/V13 `bank_accounts`+`transactions` with cursor-driven
      `MonzoIngestor`/`IngestService`/`BalanceRefreshService`, read path on `PageResponse`),
      then the E0 contract close-out (services return domain types, `api/v1` packages, DTO
      enums, 401 `ApiAuthenticationEntryPoint`, `IngestOrchestrator`) and a live IDE debug
      session (full connect→backfill→ingest walked through; invariant 4,804 raw − 247 declined
      = 4,557 domain verified). CodeQL log-injection gate cleared by making `LogSanitizer` a
      recognized barrier (char-rebuild) + sanitizing the two genuinely-unsanitized dev-controller
      sites. Docs shipped: `docs/architecture/INGEST-PIPELINE.md` +
      `.agents/notes/ingest-debug-guide.md` (12 scenarios). **8 follow-up findings recorded at
      the bottom of [plan](closed/domain-model-mapping/plan.md)** — targeted ingest dispatch,
      cross-user isolation IT, joint-account edge, callback slimming, dead event path,
      first-connect frontend contract, acceptance-test strategy, favicon 404.
      Dev QoL landed en route: `.env` imported by dev profile (IDE boot without dev.sh),
      `clean-on-startup=false`.

### August 2026
- [x] **#12 Provider Contract Hardening** (PR #85, merged 2026-08-31) — sealed `SyncPosition`
      (`FromTime` | `AfterTransaction` | `NextPage`) replaces `getTransactions`' from/to+cursor
      params (design revised in-session from `TransactionsSinceIdCapability` to Alexander's
      polymorphic-position proposal — Monzo's `since` accepts all three shapes; exhaustive
      switch beats silent capability absence); deltaSync seeds `AfterTransaction(lastTransactionId)`
      contractually. `Sourced<T>` raw-JSON envelope (redacting `toString`, PECS `map`) carries
      provenance; `BankTransaction`/`BankAccount` are pure domain values again.
      `feature/domain-model-mapping` rebased on top; #11 spec repointed.
      [plan](closed/provider-contract-hardening/plan.md)
- [x] **Provider-contract rename** (PR #80, 2026-08-24) — pulled forward from "commit 1 of
      TrueLayer" so #11's ingest code is born with the final names. `BankClient` →
      `AccountInformationProvider`, `MonzoBankClient` → `MonzoAccountInformationProvider`,
      exceptions → `ProviderException` family, `MONZO_*` codes → `PROVIDER_*`
      (`MONZO_VERIFICATION_REQUIRED` → `PROVIDER_REAUTH_REQUIRED`), jars → `provider-api` /
      `provider-monzo` with packages aligned (`dev.amfshr.budgeteer.provider[.monzo]`) and
      `provider-api` structured into `model/` + `exception/` subpackages (contracts at root).
      Data records stay `Bank*`. Zero behaviour change; full gate green.

### July 2026
- [x] **#10 Bank-Client Modules** (PR #72, merged 2026-07-06) — module renames
      (`bank-client-api` / `bank-client-monzo` / `budgeteer-server`), contract additions
      (`getBalance`→`BankBalance`, `rawJson` raw-capture on `BankTransaction`/`BankAccount`),
      jar auto-config + test hardening. Template for `bank-client-truelayer`.
      [plan](closed/bank-client-modules/plan.md)
- [x] **Repo tidy-up** (PRs #73/#74, 2026-07-08) — `frontend/` renamed to `budgeteer-web/`;
      `spring-boot:run` scripts fixed for the multi-module reactor
- [x] **Multi-Module Restructure + Monzo Client Extraction** (PR #67, merged) — 3-module reactor
      (`common`, `monzo-client`, `budgeteer-api`); Monzo HTTP client extracted into its own jar
      behind the neutral `BankClient` contract; API services program to the interface (zero Monzo
      type imports); behaviour-preserving (OAuth, refresh, backfill, delta sync all verified);
      Postman live-tested. [plan](closed/multi-module-refactor/plan.md)
- [x] **Module naming scheme decided** (2026-07-05) — `bank-client-api` (contract, `-api` per
      `slf4j-api` convention), `bank-client-monzo` (family-prefix per `spring-data-*`),
      `budgeteer-server` (frees "api" for the contract; pairs with `frontend/`). Renames execute
      as the first commit of #10.
- [x] **Domain model design** (2026-07-05) — full backend domain for the product features
      (accounts, transactions, categories, budgets, virtual pots, reports, settings) at
      `.agents/notes/domain-model-design.md`; drives #11 and the two #10 contract additions.

### June 2026
- [x] **API Endpoint Versioning (`/api/v1`)** (PR #62) — all product endpoints on `/api/v1/auth/...` and `/api/v1/monzo/...`; config, security matchers, cookie paths, magic-link URLs, tests, Postman, docs repointed
- [x] **Package & groupId rename** `dev.amf` → `dev.amfshr` (PR #61) — pure mechanical rename across 145 Java files, `pom.xml` groupId, logback, and 4 properties files. Zero behaviour change. Done before multi-module split so it's a single sweep.
- [x] **Transaction Sync — cursor fix** (PR #55): send the pagination cursor via Monzo's `since` param (Monzo has **no** `since_id`); keep `before` per window so the cursor advances. Fixes the backfill infinite loop. Verified end-to-end against real Monzo (fresh / SCA-resume / restart). *(An earlier attempt, 632cdec, misdiagnosed this as a `since_id`+`before` ordering issue — that's superseded by this fix.)*
- [x] Transaction Sync Hardening (632cdec) — per-window commits (survive stop/SCA), progress API (`GET /api/monzo/sync/progress`), readable logs, Postman updated
- [x] DB credential & Postgres hardening (PR #58); `MonzoConnectionRepositoryIT` flake fix (PR #59)
- [x] Docs/board refresh through Phase 4 (PR #60)

### May 2026
- [x] Phase 4: Transaction Sync — raw Monzo sync (accounts + transactions), backfill post-OAuth, 60-min delta job, 575 tests
- [x] Security Headers & Hardening — HSTS, CSP, CORS, error suppression; fixed `server.error.*` prefix bug; educational doc at `.agents/notes/security-headers-explained.md`

### April 2026
- [x] Phase 3: Token Auto-Refresh — background job + eager inline guard, WireMock IT, `tokenStatus` on status endpoint

### March 2026
- [x] Input Validation Hardening — Bean Validation on all user-input boundaries, IP sanitization (`IpAddressUtil`), `ConstraintViolationException` handler, 516 tests
- [x] Code Structure Refactoring — service subpackages, client/ layer, repository/ separation
- [x] Monzo Token Persistence — all phases complete (PR #25)
- [x] Email Service via Resend SMTP (PR #26)
- [x] Dependency updates: Spring Boot 4.0.2, checkstyle 13.0.0 (PR #28)
- [x] MonzoOAuthFlowIT integration tests with WireMock
- [x] MonzoClient with 401 handling
- [x] @CurrentUser/@CurrentUserId annotations

### January 2026
- [x] Infrastructure: Logging & Observability
- [x] DevOps: CI/CD Pipeline

### December 2025
- [x] Phase 1: User Authentication
- [x] Unit Testing (329 tests)
- [x] Integration Tests (35 tests)

### December 2024
- [x] Project setup
- [x] Mono-repo restructure
- [x] Documentation structure
- [x] Initial Monzo OAuth flow

---

## 📌 Quick Links

| Resource | Location |
|----------|----------|
| Session Memory | `.agents/memory.md` |
| Domain Model Design | `.agents/notes/domain-model-design.md` |
| Manual Testing Guide | `docs/MANUAL-TESTING.md` |
| Monzo OAuth Testing Plan | `docs/features/MONZO-OAUTH-TESTING-PLAN.md` |
| Security Architecture | `docs/SECURITY-ARCHITECTURE.md` |
| Setup Guide | `docs/SETUP.md` |

---

*Last updated: 2026-09-17 — #14 merged (PR #94): real login live end to end. #16 functional
slice promoted to In Progress on `feature/money-views` — real Monzo data on the minimal
shell, then Design Session 02 designs against it.*
