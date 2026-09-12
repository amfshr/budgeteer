# Ingest Pipeline — IDE Debug Guide

A self-paced walkthrough of every flow the backend exposes, scenario by scenario, with
breakpoints, psql commands, and what to expect at each step. Companion doc:
`docs/architecture/INGEST-PIPELINE.md` (the architecture map — keep it open beside this).

All line numbers are against `feature/domain-model-mapping` (PR #87).

---

## 0. Setup

### Boot for debugging

```bash
./scripts/dev.sh db          # start ONLY postgres (compose)
# then Debug BudgeteerApplication from IntelliJ — no run-config env setup needed:
# the dev profile is the default, and application-dev.properties imports .env
# directly (spring.config.import), so the IDE boot sees every secret dev.sh would
# have exported. Works from plain `mvn spring-boot:run` too.
```

`./scripts/dev.sh start` boots the app detached — fine for curl-only scenarios, useless for
breakpoints. For debugging always run the app from the IDE against the compose database.

⚠️ `app.database.clean-on-startup` in `application-dev.properties` must be `false` (it is now —
it was `true` historically): the scenarios below assume data survives restarts, and Scenario 7
kills the app on purpose. If a boot ever logs `🧹 CLEANING DATABASE`, that flag got flipped.

### psql access

```bash
docker exec -it budgeteer-postgres psql -U budgeteer -d budgeteer
# if the container name differs: docker ps --format '{{.Names}}' | grep postgres
```

### Get an auth session (dev quick-login, no magic link)

```bash
curl -s -c /tmp/bud-cookies.txt -X POST http://localhost:8080/api/dev/auth/quick-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"fisher.alexander.michael@gmail.com"}' | head -c 300
```

Tokens land in the response body (Postman-friendly) **and** as HttpOnly cookies — the cookie
jar means every later curl is just `curl -b /tmp/bud-cookies.txt ...`. Use the email of the
user who owns the Monzo connection, otherwise the read endpoints return empty data.

The Postman collection (`scripts/postman/budgeteer-domain-api.postman_collection.json`) does
the same flow with the token grabbed automatically.

### Data inventory — run this first, keep the ids handy

```sql
-- your users
select id, email from users;

-- raw Monzo accounts (provider-shaped; note the acc_... ids)
select id, account_type, closed, backfill_status from monzo_accounts;

-- domain accounts + their ingest cursor (bank_accounts.id are the UUIDs the API uses)
select id, provider_account_id, account_type, archived_at, raw_synced_through,
       balance_minor_units, balance_as_of
from bank_accounts;

-- row counts either side of the mapping
select (select count(*) from monzo_transactions)                        as raw_rows,
       (select count(*) from monzo_transactions where is_declined)      as raw_declined,
       (select count(*) from transactions)                              as domain_rows;
```

Sanity check: `domain_rows = raw_rows − raw_declined` (declined rows are never mapped).

### The map (one paragraph)

Sync writes provider-shaped rows to `monzo_accounts`/`monzo_transactions` (raw layer, each
write bumps `updated_at`). Ingest maps raw → domain (`bank_accounts`, `transactions`) driven
by a per-account cursor `bank_accounts.raw_synced_through` (only raw rows with
`updated_at > cursor` are read), through an idempotent upsert keyed on
`(provider, provider_transaction_id)`. Balances are stamped onto `bank_accounts` directly
from the provider (never derived from transactions). Entry point for everything:
`IngestOrchestrator.runFullPass()`.

### Core breakpoint set (used by most scenarios)

| # | Location | Why |
|---|----------|-----|
| B1 | `IngestOrchestrator.java:28` (`runFullPass`) | top of every pass |
| B2 | `IngestService.java:38` (per-account `txTemplate.execute`) | the transaction boundary |
| B3 | `MonzoIngestor.java:97` (`ingestTransactions` cursor resolution) | see cursor value chosen |
| B4 | `MonzoIngestor.java:112` (the upsert call) | per-row mapping |
| B5 | `MonzoIngestor.java:130` (cursor advance) | see what the cursor becomes |
| B6 | `IngestService.java:40` (`catch`) | failure isolation |
| B7 | `BalanceRefreshService.java:85` (`getBalance`) | live provider call |

Trigger for all ingest scenarios:

```bash
curl -s -b /tmp/bud-cookies.txt -X POST http://localhost:8080/api/dev/monzo/ingest
```

---## Scenario 1 — Idle pass (the cursor short-circuit)

**Goal:** see what ingest costs when there's nothing to do — the every-hour steady state.

1. No DB setup. Breakpoints B1, B3.
2. Trigger the dev ingest.
3. At B3: `account.getRawSyncedThrough()` is a real timestamp → `cursor` = that value.
4. Step over the repository call: `rows` is **empty** — the indexed `updated_at > cursor`
   query found nothing. The loop never runs, the cursor save is skipped.
5. Note `ingestAccounts()` still ran for all accounts first (`MonzoIngestor.java:63`) —
   that's the archive-detection sweep, it has no cursor on purpose.
6. Log to expect: `Ingest pass complete [provider=MONZO, accounts=N, transactionsMapped=0,
   failedAccounts=0]` then `Balance refresh complete [...]`.

**Takeaway:** an idle pass is one cheap SELECT per account. This is why chaining ingest onto
every sync trigger is fine.

## Scenario 2 — Full re-map, UPDATE path (reset the cursor)

**Goal:** watch every raw row flow through the mapper and hit the `ON CONFLICT ... DO UPDATE`
branch — data already present, rewritten in place.

1. ```sql
   update bank_accounts set raw_synced_through = null;
   ```
2. Breakpoints B3, B4, B5. Make B4 conditional later if 2.4k hits is too many — right-click
   the breakpoint → condition, e.g. `mapped < 3` for just the first few rows.
3. Trigger the dev ingest.
4. At B3: cursor is now `Instant.EPOCH` — the query returns **all** raw rows for the account.
5. At B4 inspect `raw`: the provider-shaped row (note `amount` INTEGER widening to BIGINT,
   `monzo_settled_at == null` → status `"PENDING"`). Step into the upsert if you want to see
   the native SQL in `TransactionRepository.java:27`.
6. At B5: `maxUpdated` = the max raw `updated_at` processed — **not** `now()`. Clock-skew
   rule: stamping `now()` could permanently skip a row sync wrote concurrently.
7. Verify nothing duplicated and nothing user-owned lost:
   ```sql
   select count(*) from transactions;                      -- unchanged
   select raw_synced_through from bank_accounts;           -- back to a real timestamp
   ```

**Takeaway:** re-ingest is always safe. This is the repair tool for mapping bugs: fix mapper →
null cursors → re-run.

## Scenario 3 — INSERT path (empty domain layer)

**Goal:** the same flow but with the upsert taking the insert branch — what first-ever ingest
looked like.

1. ```sql
   delete from transactions;
   update bank_accounts set raw_synced_through = null;
   ```
   (Dev DB, destructive-fine. Note this wipes any `notes` you've set on domain rows.)
2. Same breakpoints as Scenario 2. Trigger ingest.
3. Everything identical until the upsert — now each row inserts. Watch `mapped` climb.
4. Verify the invariant:
   ```sql
   select (select count(*) from monzo_transactions where not is_declined) as expected,
          (select count(*) from transactions) as actual;   -- must be equal
   ```

## Scenario 4 — Incremental delta: pending → settled

**Goal:** the cursor doing its real job — Monzo re-sends one transaction (it settled), only
that row is re-processed. This is the hourly steady-state with actual new data.

1. Pick a pending domain row and find its raw twin:
   ```sql
   select t.provider_transaction_id, t.status, t.description
   from transactions t where t.status = 'PENDING' limit 5;
   ```
   (If none are PENDING, pick any row — the mechanics are identical.)
2. Simulate Monzo settling it — touch the raw row like sync would:
   ```sql
   update monzo_transactions
   set monzo_settled_at = now(), updated_at = now()
   where id = '<provider_transaction_id from step 1>';
   ```
3. Breakpoints B3, B4. Trigger ingest — **no cursor reset this time**.
4. At B3: real cursor. Step over the query: `rows` has **exactly one element** — your row.
5. At B4: `raw.getMonzoSettledAt()` is set → status maps to `"SETTLED"`.
6. Verify:
   ```sql
   select status, settled_at from transactions
   where provider_transaction_id = '<id>';                 -- SETTLED, stamped
   select raw_synced_through from bank_accounts;           -- advanced to ~now()
   ```

**Takeaway:** `updated_at > cursor` is the whole delta mechanism — no flags, no queues.

## Scenario 5 — User-owned columns survive re-map

**Goal:** prove the upsert's UPDATE set really omits `notes` / `excluded_from_analytics`.

1. ```sql
   update transactions set notes = 'MY PRECIOUS NOTE', excluded_from_analytics = true
   where provider_transaction_id = '<same id as scenario 4>';
   ```
2. Re-touch its raw row (`update monzo_transactions set updated_at = now() where id = '<id>';`)
   and trigger ingest — the row re-maps, provider columns rewritten.
3. Verify:
   ```sql
   select notes, excluded_from_analytics, status from transactions
   where provider_transaction_id = '<id>';   -- note + flag intact
   ```
   Also glance at the raw `notes` column — Monzo's own notes seed the domain column on
   INSERT only; after that the domain copy belongs to you.

## Scenario 6 — Declined transactions: skipped but not re-read

**Goal:** see the `continue` at `MonzoIngestor.java:109` and why the cursor still advances.

1. Find one: `select id, description, updated_at from monzo_transactions where is_declined limit 3;`
2. Re-touch it: `update monzo_transactions set updated_at = now() where id = '<id>';`
3. Conditional breakpoint on `MonzoIngestor.java:110` (inside the declined branch). Trigger
   ingest.
4. The row hits the branch, is never upserted — but at B5 `maxUpdated` includes its
   `updated_at`, so the cursor moves past it. Run ingest again: Scenario 1 behaviour, the
   declined row is not re-read forever.
5. Verify it never leaked into the domain:
   ```sql
   select count(*) from transactions where provider_transaction_id = '<id>';  -- 0
   ```

## Scenario 7 — Kill mid-account: rows + cursor are atomic

**Goal:** prove one account's ingest commits all-or-nothing.

1. Best run on top of Scenario 3's setup (empty domain + null cursors) so partial state
   would be visible:
   ```sql
   delete from transactions;
   update bank_accounts set raw_synced_through = null;
   ```
2. Breakpoint B4 with condition `mapped == 500` — pauses 500 rows into the first account.
3. Trigger ingest. When it pauses, **stop the app dead** (IntelliJ red square).
4. In psql:
   ```sql
   select count(*) from transactions;                -- 0 — the 500 upserts rolled back
   select raw_synced_through from bank_accounts;     -- still null — cursor never moved
   ```
   The per-account `TransactionTemplate` (`IngestService.java:38`) held all 500 writes in one
   uncommitted transaction; the JVM dying rolled it back wholesale.
5. Remove the breakpoint condition, reboot the app, trigger ingest again — it re-reads from
   the (unmoved) cursor and completes. Nothing lost, nothing duplicated.

**Takeaway:** cursor and rows move together or not at all — the dangerous state (cursor ahead
of data) cannot exist.

## Scenario 8 — Poison account: failure isolation

**Goal:** one account blowing up must not stop the others.

1. Null the cursors (Scenario 2 setup). Breakpoints B4 and B6.
2. Trigger ingest. At the first B4 hit, in the IntelliJ **Frames** panel right-click the
   `ingestTransactions` frame → **Throw Exception** →
   `new RuntimeException("simulated poison account")`.
3. Execution lands on B6 (`IngestService.java:40`): the catch logs
   `Ingest failed [provider=MONZO, account=...]`, increments `failed`, and the loop moves to
   the **next account**, which ingests normally.
4. Final log: `Ingest pass complete [... transactionsMapped=<other accounts' rows>,
   failedAccounts=1]`. The failed account's transaction rolled back, its cursor is still
   null — run ingest again and it recovers on its own.

*(No Throw Exception action in your IDE version? Alternative: `alter table transactions alter
column merchant_category type varchar(1);` → every account fails on the first long category →
watch B6 catch repeatedly → restore with `... type varchar(100);` and re-ingest.)*

## Scenario 9 — Account lifecycle: archive, don't delete

**Goal:** the no-cursor `ingestAccounts()` sweep doing its actual job.

1. Breakpoint `MonzoIngestor.java:85` (the closed/inactive check).
2. ```sql
   update monzo_accounts set closed = true where id = '<acc_... id>';
   ```
3. Trigger ingest. At the breakpoint watch `domain.archive()` run.
4. Verify, including what the API now shows:
   ```sql
   select provider_account_id, archived_at from bank_accounts;
   ```
   ```bash
   curl -s -b /tmp/bud-cookies.txt 'http://localhost:8080/api/v1/accounts' | head -c 400
   curl -s -b /tmp/bud-cookies.txt 'http://localhost:8080/api/v1/accounts?includeArchived=true' | head -c 400
   ```
   Archived account absent from the first, present in the second. Its transactions are all
   still there — archive-not-delete, identity stable.
5. Cleanup: set `closed = false`, re-ingest, watch `unarchive()`.

## Scenario 10 — Balance refresh (live Monzo call)

**Goal:** the second half of `runFullPass()` — snapshots stamped, never derived.

⚠️ Hits the real Monzo API — needs the connection's token to be valid (the refresh job runs
every 30 min while the app is up; a revoked/expired connection logs a skip, which is itself
worth seeing).

1. Breakpoints B7 (`getBalance`, line 85) and `BalanceRefreshService.java:90`
   (`recordBalance`).
2. Trigger the dev ingest (the pass always ends with `refreshAll()` — B7 hits after ingest).
3. Note the shape: grouped by connection (one token fetch per connection, line 64), balance
   written onto `bank_accounts.balance_minor_units` / `balance_as_of` — there is no balance
   table, and nothing ever sums transactions to derive it (L3 decision).
4. ```sql
   select provider_account_id, balance_minor_units, balance_as_of from bank_accounts;
   ```
   `balance_as_of` just moved. Cross-check the figure against your Monzo app.

## Scenario 11 — (Optional, live) Full backfill: the sync side

**Goal:** the other half of the pipeline — provider → raw — plus the chained ingest at the end.

⚠️⚠️ **Read before running.** `POST /api/dev/monzo/reset-backfill/{acc_...id}` **deletes that
account's raw transactions** and resets its backfill state. Monzo only serves ~90 days of
history unless the connection was authorised in the last ~5 minutes — so on your long-lived
connection, a reset + re-backfill recovers only ~90 days of **raw** rows (domain rows survive
untouched; nothing user-facing is lost, but the raw archive shrinks). Either accept that, or
re-OAuth first to open the full-history window, or skip this scenario — the sync code is also
walkable read-only via the hourly job (breakpoint `TransactionSyncJob.java:47`).

1. Breakpoints: `TransactionSyncService.java:121` (`backfill`), `:230` (`backfillAccount` —
   the 350-day window loop, watch `backfill_progress_at`/`backfill_progress_cursor` persist
   per page), `:161` (the chained `runFullPass` — same B1 flow you know, no cron wait).
2. ```bash
   curl -s -b /tmp/bud-cookies.txt -X POST \
     http://localhost:8080/api/dev/monzo/reset-backfill/<acc_...id>
   curl -s -b /tmp/bud-cookies.txt -X POST http://localhost:8080/api/dev/monzo/backfill
   ```
3. Watch raw rows repopulate, then the familiar ingest pass fire automatically at the end —
   the "ingest is part of every provider flow" wiring, live.
4. Sync progress endpoint while it runs:
   `curl -s -b /tmp/bud-cookies.txt http://localhost:8080/api/v1/monzo/sync/progress`

## Scenario 12 — The read path and the error contract

**Goal:** what the frontend will actually consume. Breakpoints: `AccountService.java:33`,
`AccountService.java:46`, `TransactionQueryService.java:38`,
`CurrentUserArgumentResolver.java:73` (identity resolution — worth stepping once).

```bash
B='-b /tmp/bud-cookies.txt -s'; H=http://localhost:8080

# happy paths
curl $B "$H/api/v1/accounts"
curl $B "$H/api/v1/accounts/<bank_accounts.id UUID>/summary"            # Europe/London default
curl $B "$H/api/v1/accounts/<id>/summary?zone=America/New_York"        # windows shift
curl $B "$H/api/v1/transactions?page=0&size=5"
curl $B "$H/api/v1/transactions?accountId=<id>&from=2026-08-01T00:00:00Z&to=2026-09-01T00:00:00Z"

# the error contract — one ApiError envelope everywhere
curl $B "$H/api/v1/accounts/<id>/summary?zone=Not/AZone"     # 400 — native ZoneId binding
curl $B "$H/api/v1/transactions?from=2026-09-01T00:00:00Z&to=2026-08-01T00:00:00Z"
                                                             # 400 VALIDATION_ERROR from>=to
curl -s "$H/api/v1/accounts"                                 # no cookie → 401 MISSING_TOKEN
                                                             # (ApiAuthenticationEntryPoint)
curl $B "$H/api/v1/accounts/00000000-0000-0000-0000-000000000000/summary"
                                                             # not yours/nonexistent → not-found
curl $B "$H/api/v1/transactions?accountId=00000000-0000-0000-0000-000000000000"
                                                             # non-owned account → EMPTY page,
                                                             # not an error (user-scoped query)
```

Things to notice for the frontend: every response is the `ApiResponse`/`ApiError` envelope;
paging is the house `PageResponse` shape; unauthenticated is **401 + JSON envelope** (your
interceptor can key off it); ownership failures are indistinguishable from not-found (no
account-existence oracle).

---

## Appendix A — Full endpoint surface (what the frontend gets)

| Area | Endpoint | Notes |
|------|----------|-------|
| Auth | `POST /api/v1/auth/login` | request magic link (email) |
| | `GET /api/v1/auth/verify` | magic-link landing → session cookies |
| | `POST /api/v1/auth/refresh` | rotate session |
| | `POST /api/v1/auth/logout` | |
| | `GET /api/v1/auth/me` | current user |
| Monzo | `GET/POST /api/v1/monzo/connect` | start OAuth |
| | `GET /api/v1/monzo/callback` | OAuth return → triggers async backfill |
| | `GET /api/v1/monzo/connections`, `GET/DELETE /connections/{id}` | manage links |
| | `GET /api/v1/monzo/sync/progress`, `GET /status` | backfill/sync visibility |
| Domain | `GET /api/v1/accounts?includeArchived=` | list (enums typed) |
| | `GET /api/v1/accounts/{id}/summary?zone=` | today / this week / month-to-date sums |
| | `GET /api/v1/transactions?accountId&from&to&page&size` | newest-first, half-open `[from,to)` |
| Health | `GET /api/health`, `/ready`, `/live` | unauthenticated |
| Dev only | `POST /api/dev/auth/quick-login`, `/revoke-all`, `/revoke-user` | `dev` profile |
| | `POST /api/dev/monzo/backfill`, `/ingest`, `/reset-backfill/{accId}` | `dev` profile |

## Appendix B — Reference

**Scheduled jobs** (`application.properties`): transaction sync + chained ingest hourly
(`0 0 */1 * * *`), token refresh every 30 min (`0 */30 * * * *`). To watch the cron path
without waiting: add `monzo.transaction-sync.job-cron=0 */2 * * * *` to the IDE run config's
overrides (fires every 2 min) — then breakpoint `TransactionSyncJob.java:31`.

**Cursor reset (the repair tool):**
```sql
update bank_accounts set raw_synced_through = null;               -- all accounts
update bank_accounts set raw_synced_through = null where id = '<uuid>';  -- one
```

**Log lines that narrate a pass:**
```
DEV: Triggering manual ingest + balance refresh for user ...
Ingested N transactions [account=..., rawRows=..., cursor → ...]
Ingest pass complete [provider=MONZO, accounts=N, transactionsMapped=N, failedAccounts=0]
Balance refresh complete [accountsRefreshed=N]
```

**Table cheat sheet:**

| Table | Layer | Key columns for debugging |
|-------|-------|---------------------------|
| `monzo_connections` | raw | tokens (encrypted), `active` |
| `monzo_accounts` | raw | `id` (acc_...), `closed`, `backfill_status/_progress_at/_progress_cursor`, `last_transaction_id` |
| `monzo_transactions` | raw | `id` (tx_...), `is_declined`, `monzo_settled_at`, `updated_at` (the cursor's clock), `raw_payload_encrypted` |
| `bank_accounts` | domain | `raw_synced_through` (cursor), `archived_at`, `balance_minor_units`, `balance_as_of` |
| `transactions` | domain | unique `(provider, provider_transaction_id)`, user-owned `notes`/`excluded_from_analytics`, `status` |

**Restore normality after any scenario:** null all cursors, trigger the dev ingest, then
compare counts (Setup §inventory). The pipeline heals itself — that's the design.
