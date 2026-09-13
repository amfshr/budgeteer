# Web 03 — The shape we'll grow into

> Previous: [02 — React & TypeScript primer](02-react-ts-primer.md)
>
> The scaffold is deliberately tiny. This doc is the map for how it grows through epics
> #14–#16 without turning into soup — plus the API-contract story (OpenAPI).

## 1. Organising principle: by feature, not by kind

Small React apps rot when everything piles into `components/` and `utils/`. The house rule
from the start: **group by feature** — a folder per product area owning its components,
hooks and API calls. Only genuinely shared things live at the top.

Target shape as the epics land:

```
src/
├── main.tsx / App.tsx            # bootstrap + shell + route table (stays thin)
├── api/
│   ├── client.ts                 # transport: envelope, errors, 401 (exists)
│   └── types.ts                  # shared wire types (PageResponse, enums...) — later
│                                 #   generated from OpenAPI, see §3
├── features/
│   ├── auth/                     # ← #14
│   │   ├── LoginPage.tsx         #    email form → POST /auth/login
│   │   ├── MagicLinkSent.tsx     #    "check your inbox"
│   │   ├── VerifyPage.tsx        #    /auth/verify handoff → session
│   │   ├── useSession.ts         #    hook: current user (GET /auth/me), logout
│   │   └── RequireAuth.tsx       #    route guard: no session → redirect to login
│   ├── settings/                 # ← #15 (profile, disconnect, export, delete+purge)
│   ├── accounts/                 # ← #16
│   │   ├── AccountsPage.tsx
│   │   ├── useAccounts.ts        #    useQuery(['accounts'], ...)
│   │   └── AccountCard.tsx
│   ├── transactions/             # ← #16 (list, filters, paging)
│   └── monzo/                    # ← #16 (connect flow, sync progress polling — finding #6)
├── components/                   # ONLY cross-feature UI (e.g. Money.tsx rendering
│                                 #   minor-units + currency properly, EmptyState, Spinner)
├── pages/                        # thin route-level pages that compose features
└── test/setup.ts
```

Rules of thumb:
- A component used by one feature lives in that feature's folder. It moves to
  `components/` only when a *second* feature needs it — same "abstraction earns its
  keep on the second consumer" principle as the provider contracts.
- **All server data flows through TanStack Query hooks** (`useAccounts`, `useTransactions`),
  never raw `fetch`/`get` in components. The hook owns the `queryKey`; components own
  presentation. This is the layering rule of the frontend — the mirror of "services return
  domain, controllers map DTOs".
- Tests sit next to what they test (`AccountCard.test.tsx` beside `AccountCard.tsx`).

## 1a. The shell: what persists vs what swaps (Alexander, 2026-09-13)

The app uses the **app-shell pattern**: persistent chrome, swapping content. Mechanism:
React Router **layout routes** — a route that renders the chrome plus an `<Outlet/>` where
child routes appear. Navigation re-renders *only the outlet*; the shell never unmounts.

**Fixed now (stack mechanics, independent of any design choice):**
- Two shells split by auth: **`PublicLayout`** (minimal top bar, centered content — landing,
  login, magic-link-sent, verify) and **`AppLayout`** (wrapped in `RequireAuth` — all
  authenticated pages render in its outlet).
- Rule: **pages never render chrome.** If a page wants something persistent, that's a shell
  change, discussed as such.

**Deliberately OPEN — decided by Design Session 02, not by pattern-matching (Alexander's
call):** what the authenticated chrome actually *is*. The sidebar-console shape
(GitHub/Cloudflare/Claude) fits "many instances of one thing" products where the dominant
interaction is picking one from a list. Budgeteer is different: one household's money seen
through many lenses — glanceable balances, drill-into-account, monthly reports, pots,
customisable summary widgets (Session 01 §dec 18). The better reference class is **money
apps** (Monzo, Revolut, YNAB, Emma), which mostly converge on dashboard-first homes and
bottom-tab navigation on mobile — relevant since daily phone use is the goal. Sidebar vs
bottom-tabs vs hub-and-drill-in must fall out of the user stories: what's reached daily vs
weekly vs monthly, what's glanceable vs sought-out, where pots/reports sit in the mental
model.

**Timing:** #14 needs only `PublicLayout` (design-trivial, no IA risk). Session 02 — the
user-story grill producing the interaction model + chrome decision, with the
claude.ai/design visual pass inside it — runs after #14, before any authenticated pages
(#15/#16) are built. Design-tool output is translated into react-bootstrap, never pasted
(no second CSS framework by accident).

## 2. The route table as it will look after #14–#16

```
/                     Landing (public)
/login                LoginPage
/auth/verify          VerifyPage (magic-link target — token in query param)
/app                  RequireAuth ▸ Home/dashboard v1
/app/accounts         RequireAuth ▸ AccountsPage
/app/accounts/:id     RequireAuth ▸ account detail + summary windows
/app/transactions     RequireAuth ▸ TransactionsPage
/app/settings         RequireAuth ▸ SettingsPage (#15)
```

`RequireAuth` is a tiny wrapper route: query `GET /api/v1/auth/me`; while pending show a
spinner, on 401 redirect to `/login` (the api client's `setUnauthorizedHandler` covers the
mid-session-expiry case globally). Everything under `/app` nests inside it once, so no page
re-implements the check.

Server state patterns we already know we'll need:
- **First-connect progress (finding #6):** `useQuery(['sync-progress'], ...)` with
  `refetchInterval` while status is `IN_PROGRESS`, then invalidate `['accounts']` and
  `['transactions']` — data "streams in" without a manual refresh button doing anything
  clever.
- **Money:** the API sends integer minor units + currency (never floats). One shared
  `<Money>` component does the formatting via `Intl.NumberFormat` — no arithmetic in
  components.
- **Timestamps:** render `balance_as_of` next to balances (decided during the
  balance-snapshot discussion — staleness is displayed, never hidden).

## 3. The API contract problem → OpenAPI (your side note, agreed)

Right now the frontend's knowledge of the API lives in hand-written TS types checked
against... vibes and the Postman collection. That's fine for two endpoints and rots at ten.
The right tool is exactly what you suggested: **a maintained OpenAPI spec, generated from
the server code** so it can't drift:

1. **Server:** add `springdoc-openapi-starter-webmvc-ui` to `budgeteer-server`. It reads the
   Spring MVC annotations we already have (plus the DTO record types) and serves
   `/v3/api-docs` (JSON spec) + Swagger UI at `/swagger-ui.html`. Near-zero code — a config
   class to set title/version and, where the defaults fall short, `@Operation`/`@Schema`
   annotations added incrementally. Gate the UI to the dev profile.
2. **Snapshot in the repo:** a small script (or test) writes the spec to
   `docs/api/openapi.json` so the contract is reviewable in PRs and readable by tooling
   (and by Claude) without a running server. When an endpoint changes, the diff shows up in
   review like any other file.
3. **Generated TS types (the payoff):** run `openapi-typescript` in `budgeteer-web` to
   generate `src/api/types.ts` from the snapshot. Hand-written wire types disappear;
   a server-side rename becomes a frontend *compile error* instead of a runtime surprise.
   The envelope narrowing in `client.ts` stays hand-written (it's behaviour, not shape).

Sequencing: springdoc + snapshot land as a small ticket **before/at the start of #14** (login
is the first real contract consumption); the type-generation step can join when the first
domain views land in #16. Postman stays for what it's good at — a runnable walk-through —
and stops pretending to be documentation.

## 4. Conventions summary (the short version to remember)

- Feature folders; promotion to `components/` only on the second consumer
- Server data only via query hooks; `queryKey`s are the cache vocabulary of the app
- Wire types come from the contract (OpenAPI-generated once that lands); domain formatting
  (money, dates) in shared components
- `npm run format` before every commit; lint and tests are CI gates, same as checkstyle
- Route-level pages stay thin — composition only
