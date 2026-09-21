# Architecture

> Full docs: `docs/architecture/ARCHITECTURE.md` · `docs/architecture/MONZO-AUTH-FLOW.md`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 4.1.1, Java 25 (multi-module Maven reactor) |
| Frontend | `budgeteer-web/`: Vite 8, React 19, TypeScript strict, Tailwind v4 (CSS-first), shadcn/ui, TanStack Query, React Router v7, Vitest/RTL |
| API contract | springdoc (dev-gated) → committed `docs/api/openapi.json` → generated TS types (`npm run generate:types`, prettier the output) |
| Database | PostgreSQL 16 (Alpine via Docker) |
| Migrations | Flyway — `budgeteer-server/src/main/resources/db/migration/` |
| Auth | Magic links + JWE tokens (JOSE library) |
| Encryption | AES-256-GCM (Monzo OAuth tokens at rest) |
| Email | Resend SMTP (`spring-boot-starter-mail`) |
| Testing | JUnit 5, Mockito, Testcontainers (real PG), WireMock |
| CI/CD | GitHub Actions (ci.yml, codeql.yml) |
| External API | Monzo Banking API (OAuth 2.0 confidential client) |

## Package Structure

```
dev.amfshr.budgeteer/            (budgeteer-server; contracts live in provider-api,
├── api/                          Monzo HTTP client in provider-monzo)
│   ├── common/       #   ApiResponse, ApiError, GlobalExceptionHandler, PageResponse
│   ├── dev/          #   dev-only shortcuts (dev profile)
│   ├── health/       #   health wrapper
│   └── v1/           #   by-resource: account/ auth/ monzo/ transaction/ (each with dto/ + mapper)
├── config/           # @Configuration + properties bindings
├── domain/           # JPA entities + repos: user/ session/ monzo/ account/ transaction/
├── repository/       # Spring Data repositories
├── service/          # auth/ common/ ingest/ monzo/ (orchestrator + per-provider ingestors)
├── security/         # JweAuthenticationFilter, CurrentUserArgumentResolver
├── exception/        # ApiException + ErrorCode
└── util/             # LogSanitizer (char-loop — CodeQL taint barrier)
```

`budgeteer-web/src/`: `api/` (envelope client + generated types), `features/` (auth,
accounts, dashboard, monzo, transactions — hooks own server state, components never
fetch), `components/` (ui/ = shadcn copy-in, Wordmark, Money), `layouts/`, `pages/`,
`lib/`, `test/`.

## Database Schema (13 migrations)

| Migration | Table | Purpose |
|-----------|-------|---------|
| V1 | — | Baseline placeholder |
| V2 | `users` | UUID PK, email (unique), email_verified |
| V3 | `magic_link_tokens` | SHA-256 hash, expires_at, used_at (replay prevention) |
| V4 | `app_refresh_tokens` | SHA-256 hash, revoked_at, user_agent, ip_address |
| V5 | `monzo_connections` | Encrypted tokens, soft-delete via disconnected_at |
| V6 | `oauth_states` | CSRF state for Monzo OAuth, 10-min expiry, used flag |
| V7–V10 | `monzo_accounts` | Raw accounts + created-at + backfill state/cursor |
| V8 | `monzo_transactions` | Raw transactions (id-keyed, idempotent upsert) |
| V11 | (both raw) | Encrypted raw payload capture + mapping index |
| V12 | `bank_accounts` | Domain accounts (provider-agnostic; balance = provider snapshot) |
| V13 | `transactions` | Domain transactions (user-owned notes/exclusions survive upsert) |

Next migration will be **V14** (use `/new-migration`).

## Key Architectural Decisions

- **Multi-session**: Users can be logged in on multiple devices simultaneously (like Google/Facebook). `app_refresh_tokens` is a table, not a single column.
- **Hash-only token storage**: Plain tokens are never stored. SHA-256 hashes only. Tokens sent to clients are unhashed.
- **AES-256-GCM for Monzo tokens**: Provides both confidentiality and integrity. Key loaded from `MONZO_ENCRYPTION_KEY` env var.
- **JWE for session tokens**: Stateless access tokens, refresh tokens backed by DB for revocation.
- **Testcontainers for ITs**: Integration tests spin up a real PostgreSQL — no mocking the DB.
- **Database-backed OAuth state**: State tokens linked to `user_id` for CSRF protection + user binding.
- **Soft delete on `monzo_connections`**: `disconnected_at` instead of hard delete. Unlink keeps
  all imported data (dormant); reconnect reactivates the same row, backfill no-ops (resume
  cursor doubles as done-detection) and a chained delta closes the dormant gap.
- **Two-layer data model**: raw `monzo_*` tables → domain `bank_accounts`/`transactions` via
  ingest; cursor `raw_synced_through` = max processed raw `updated_at` (never `now()`);
  per-account transactions (failure unit = retry unit); balance is a provider snapshot, never derived.
- **Single-session policy**: a new login revokes all existing sessions (`revokeAllSessions`).
- **DECIDED 2026-09-20 (lands before #17)**: per-request session validation in
  `JweAuthenticationFilter` — drops pure statelessness so logout/delete kill access tokens
  instantly (also fixes ghost-session inconsistency after DB wipes/user deletion).

## Glossary: Provider vs Institution (decided 2026-08-22)

Two distinct concepts — never conflate them:

- **Provider** — the external service we integrate with: it holds the OAuth/consent connection
  and answers our API calls. Values: `MONZO`, `TRUELAYER`. In code/schema: the `Provider` enum,
  `provider`, `provider_account_id`, `provider_transaction_id` columns.
- **Institution** — the real bank behind an account: Monzo, Lloyds, HSBC. In schema:
  `institution_name` on `user_accounts`. For Monzo, provider == institution. A single TrueLayer
  connection can yield accounts at many institutions. **TrueLayer is never called a bank.**

Provider capability interfaces follow PSD2 vocabulary (AIS / PIS):

- Capability contracts (split from the single `AccountInformationProvider` **2026-08-25, PR #84**):
  `ProviderConnectionAuth` (OAuth lifecycle + identity), `AccountsCapability`,
  `BalanceCapability`, `TransactionsCapability` — implementations pick the set they support.
  Rename from the old
  `BankClient` **executed 2026-08-24 (PR #80)**: impl is `MonzoAccountInformationProvider`,
  exceptions are `ProviderException` / `ProviderConnectionRevokedException` /
  `ProviderReauthRequiredException`, error codes are `PROVIDER_*`, jars are `provider-api` /
  `provider-monzo` (future `provider-truelayer`). Packages align with the jars:
  `dev.amfshr.budgeteer.provider` (contracts at root, data records in `.model`, exceptions in
  `.exception`) and `dev.amfshr.budgeteer.provider.monzo` (with `.dto` / `.autoconfigure`).
- `PaymentInitiationProvider` — future capability if we adopt TrueLayer payments. One impl class
  may implement both interfaces (e.g. `TrueLayerClient`).

Data records stay `Bank*` (`BankAccount`, `BankTransaction`, `BankBalance`) — they describe the
**institution's** artifacts, which genuinely are bank things; only the provider was mislabelled.

Raw→domain promotion is **ingest**: `IngestService.ingestAll()` orchestrates per-provider
`ProviderIngestor` impls (`MonzoIngestor`) in `budgeteer-server`. The client jars never touch
the database.

## Environment Profiles

- `dev` — DEBUG logging, show SQL, hot reload via `./scripts/dev.sh`
- `prod` — INFO logging, connection pooling (max 10), batch size 20

Config files: `budgeteer-server/src/main/resources/application*.properties` (dev imports `.env`)
