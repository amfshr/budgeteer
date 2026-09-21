# Budgeteer

[![Build & Test](https://github.com/amfshr/budgeteer/actions/workflows/ci.yml/badge.svg)](https://github.com/amfshr/budgeteer/actions/workflows/ci.yml)
[![CodeQL](https://github.com/amfshr/budgeteer/actions/workflows/codeql.yml/badge.svg)](https://github.com/amfshr/budgeteer/actions/workflows/codeql.yml)
[![Java](https://img.shields.io/badge/Java-25-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

A personal budgeting application integrated with the Monzo API: full transaction history
sync into a provider-agnostic domain model, live balances and spend views in a React web
app, with pots/targets/budgeting on the roadmap.

## Project Structure

This is a **mono-repo** containing:

```
budgeteer/
├── provider-api/      # Provider-neutral capability contracts (auth, accounts, balance, transactions)
├── provider-monzo/    # Monzo implementation (HTTP client jar — never touches the DB)
├── budgeteer-server/  # Spring Boot application (API, auth, sync, ingest, domain model)
├── budgeteer-web/     # React SPA (Vite, TypeScript, Tailwind v4 + shadcn/ui)
├── docs/              # Documentation + committed OpenAPI contract (docs/api/openapi.json)
├── scripts/           # Development scripts (dev.sh, generate-openapi.sh)
└── compose.yaml       # Docker services (PostgreSQL 16)
```

## Quick Start

### Prerequisites

- Java 25+ ([SDKMAN](https://sdkman.io/) recommended)
- Maven 3.9+
- Docker & Docker Compose
- [Monzo Developer Account](https://developers.monzo.com/)

### Setup

1. **Clone and configure:**
   ```bash
   git clone https://github.com/amfshr/budgeteer.git
   cd budgeteer
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Generate secret keys:**
   ```bash
   openssl rand -base64 32   # JWE_SECRET_KEY
   openssl rand -base64 32   # MONZO_ENCRYPTION_KEY
   # Add both to .env
   ```

3. **Start the database:**
   ```bash
   docker compose up -d
   ```

4. **Run the backend:**
   ```bash
   ./scripts/dev.sh start
   ```

5. **Run the web app:**
   ```bash
   cd budgeteer-web && npm install && npm run dev
   ```

6. **Access the app:**
   - Web app: http://localhost:5173 (Vite proxies `/api` to the backend — same-origin cookies)
   - API: http://localhost:8080 · Health: http://localhost:8080/actuator/health
   - Swagger UI (dev): http://localhost:8080/swagger-ui.html

See [docs/setup/SETUP.md](docs/setup/SETUP.md) for detailed setup instructions.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Spring Boot 4.1, Java 25 (multi-module Maven reactor) |
| **Frontend** | React 19, Vite, TypeScript (strict), Tailwind v4, shadcn/ui, TanStack Query, React Router v7 |
| **API contract** | springdoc OpenAPI snapshot → generated TypeScript types |
| **Database** | PostgreSQL 16 |
| **Migrations** | Flyway |
| **Authentication** | Passwordless magic links + JWE cookie tokens (single-session) |
| **Monzo integration** | OAuth 2.0, AES-256-GCM encrypted token storage, windowed backfill + hourly delta |
| **Email** | Resend SMTP (branded HTML magic-link email) |
| **Testing** | JUnit 5, Testcontainers, WireMock (server) · Vitest + Testing Library (web) |
| **CI/CD** | GitHub Actions (server + web jobs) |
| **Security scanning** | CodeQL |

## Authentication

Budgeteer uses a **passwordless authentication** system:

1. User enters email → receives a magic link (single-use, 15-minute, hash-stored)
2. Magic link validates → JWE access token (15 min) + refresh token (7 days) issued as HttpOnly cookies
3. Single-session policy — a new login revokes existing sessions everywhere else
4. Monzo connection is user-scoped; unlinking stops syncing but keeps imported data until deletion

See [docs/features/USER-AUTHENTICATION.md](docs/features/USER-AUTHENTICATION.md) for details.

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md) — Technical design decisions
- [CI/CD Setup](docs/setup/CI-CD.md) — GitHub Actions pipeline
- [Monzo Auth Flow](docs/architecture/MONZO-AUTH-FLOW.md) — OAuth implementation
- [Security Architecture](docs/architecture/SECURITY-ARCHITECTURE.md) — Security model
- [Setup Guide](docs/setup/SETUP.md) — Development environment
- [Testing Guide](docs/testing/TESTING.md) — Test strategy and conventions
- [Secrets Management](docs/setup/SECRETS-MANAGEMENT.md) — Handling credentials

## Testing

```bash
# Server (repo root)
mvn test                              # all
mvn test -DexcludedGroups=integration # unit only
mvn test -Dgroups=integration         # ITs (requires Docker)

# Web
cd budgeteer-web && npm test
```

526 unit + 133 integration tests (server), 39 web tests.

## CI/CD

Every push and PR runs:

- **Build & Test** — compile, unit tests, integration tests
- **Code Style** — Checkstyle (Google Java Style)
- **Security Scanning** — CodeQL
- **Dependency Updates** — Dependabot (monthly)

## Current Status

**Backend platform complete; frontend era well underway.**

- [x] User authentication — magic links, JWE cookies, single-session
- [x] Monzo integration — OAuth, encrypted tokens, auto-refresh, full-history backfill + hourly delta
- [x] Domain model — raw→domain ingest, provider-agnostic accounts/transactions, read APIs
- [x] Web app — real login, dashboard (balances, spend windows, recent activity),
      transactions, connect onboarding with live progress, settings (connected banks,
      sync-now, unlink)
- [x] Brand — b-mark icon set, wordmark, branded email
- [ ] Pots, targets & labels (next — designed, awaiting build)
- [ ] Data rights (export + delete), edge deployment (Cloudflare Tunnel + Access)
- [ ] Webhooks (near-real-time sync), TrueLayer multi-bank

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for git workflow, branch naming, and commit conventions.

## License

Private project — not for distribution.

---

*Built with coffee and frustration at where my money goes*
