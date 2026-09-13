# Commands

> Full docs: `docs/setup/SETUP.md` · `docs/setup/CI-CD.md` · `docs/testing/TESTING.md`

## Database

```bash
docker compose up -d          # Start PostgreSQL (detached)
docker compose down           # Stop and remove containers
docker compose ps             # Check container status
docker compose logs db        # View DB logs
```

## Running the App

```bash
./scripts/dev.sh              # Start app (loads .env, checks Java, starts DB if needed)
./scripts/dev.sh start        # Explicit start
./scripts/dev.sh stop         # Stop app
./scripts/dev.sh restart      # Restart
./scripts/dev.sh status       # Show app + DB status
./scripts/dev.sh db           # Start DB only
./scripts/dev.sh tunnel       # Start ngrok tunnel (for Monzo OAuth redirect URI)
```

## Testing

```bash
# From backend/ directory:
cd backend

mvn test                                    # All tests (unit + integration)
mvn test -DexcludedGroups=integration       # Unit tests only (no Docker needed)
mvn test -Dgroups=integration               # Integration tests only (needs Docker)
mvn test -Dtest=AuthServiceTest             # Single test class
mvn test -Dtest=AuthFlowIT                  # Single IT class

# Via dev script (from project root):
./scripts/dev.sh test                       # All tests (unit + integration, requires Docker)
./scripts/dev.sh unit                       # Unit tests only (no Docker)
./scripts/dev.sh it                         # Integration tests only
./scripts/dev.sh it MonzoOAuthFlowIT        # Single IT class
```

## Code Quality

```bash
cd backend
mvn checkstyle:check          # Verify code style
mvn checkstyle:checkstyle     # Generate checkstyle report
mvn compile                   # Compile only
mvn verify                    # Compile + test + checkstyle
```

## URLs (when running locally)

| Endpoint | URL |
|----------|-----|
| Health | http://localhost:8080/actuator/health |
| Auth — request magic link | POST http://localhost:8080/auth/login |
| Auth — verify magic link | GET http://localhost:8080/auth/verify?token=... |
| Monzo OAuth — initiate | GET http://localhost:8080/auth/connect |
| Dev login (dev profile only) | POST http://localhost:8080/dev/auth/login |

## Useful Scripts

```bash
# Postman collection + environment
scripts/postman/budgeteer-auth.postman_collection.json
scripts/postman/budgeteer-local.postman_environment.json

# Manual SQL queries for testing
scripts/sql/manual-testing.sql
scripts/sql/queries.sql
```

## Key Generation

```bash
openssl rand -base64 32       # Generate JWE_SECRET_KEY or MONZO_ENCRYPTION_KEY
```

## Frontend (budgeteer-web)

```bash
cd budgeteer-web
npm install            # once
npm run dev            # Vite dev server on :5173 — /api proxied to Spring :8080
npm test               # Vitest run (npm run test:watch for watch mode)
npm run lint           # ESLint
npm run format         # Prettier write (format:check is the CI variant)
npm run build          # tsc type-check + production bundle → dist/
```

Dev flow: start the backend first (IDE debug run or `./scripts/dev.sh`), then `npm run dev` —
the Vite proxy keeps the app same-origin with the API so session cookies just work.

## OpenAPI

```bash
# Regenerate the committed API contract snapshot (backend must be running, dev profile)
./scripts/generate-openapi.sh          # writes docs/api/openapi.json (jq-sorted for clean diffs)
# Swagger UI (dev only): http://localhost:8080/swagger-ui.html
```

Regenerate + commit the snapshot alongside any API change — the diff in docs/api/openapi.json
is the reviewable contract change.
