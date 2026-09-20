# E6 Views Polish & Shell

> **Priority:** 🟡 P2 | **Estimate:** 1.5–2d | **Status:** In Progress
> **Branch:** `feature/views-polish` | **Spec:** Session 02 decisions 26–32
> ([design-session-02-user-stories.md](../../notes/product/design-session-02-user-stories.md))

## Goal

Turn the proven-but-plain #16 slice into the app Session 02 designed: real chrome (bottom
tabs / top nav), the four-block dashboard, guided connect onboarding, and a readable
transaction list — structure first, with the branding tokens applied when Alexander's
claude.ai/design pass lands.

## Scope

**Structural (build now):**
- [x] Chrome (dec 26): AppLayout → bottom tab bar on mobile (Overview · Transactions ·
      Settings placeholder), slim top nav ≥sm; active states; logout moves to Settings-ish
      corner
- [x] Dashboard v1 (dec 27): four widget-shaped blocks — Balance (total + per-account,
      as-of), This month (MTD out via the summary API — first consumer!), This week,
      Recent transactions
- [x] `/app/connect` onboarding (dec 28): four phases — explainer/CTA → "approve the push
      in your Monzo app" → importing w/ live count → green success ✓ → overview. Server
      callback redirect target updated to `/app/connect`; overview drops all connect
      states/banners
- [x] Tx polish (dec 31): date group headers (Today/Yesterday/…), income in green
      (new `money-positive` theme token), pending badge, account filter dropdown
- [x] Account display name (dec 30): mapping-level sane default ("Monzo Current Account")
      when displayName looks like an id — server-side in MonzoIngestor/mapper
- [x] Settings tab placeholder page (destination exists per dec 26; #15 fills it)
- [x] Tests updated/extended; all gates green

**Visual (after Alexander's claude.ai/design pass with the Branch-B brief):**
- [x] Apply branding (design canvas option 1a + palette 3e, dec 33): page tint token,
      Wordmark component (lowercase + emerald dot signature), balance hero with
      de-emphasised pence + account chips + "as of · synced hourly" status line, spend
      cards with range labels and in/out rows (weekIn added to the summary hook),
      transaction rows with merchant-initial avatars + time sub-line + outline Pending
      pill, safe-area padding on the tab bar. Future specs (pots 2a–2c, settings 4a–4e,
      OTP 4f–4h) live in the canvas for their epics

## Non-goals

Targets/pots UI (#19), popup consent (auth-v2), widget configurability (post-#19).

## Live E2E round 2 findings — all fixed in this branch (2026-09-19)

- **PII/secrets in logs (Alexander spotted the email)**: (1) EmailService logged the raw
  recipient — now maskEmail'd; (2) Spring MVC DEBUG prints deserialized DTOs via toString —
  LoginRequest now masks its toString (**rule: any PII-carrying DTO must**); (3) worse:
  RestClient DEBUG logged the token-exchange body including the Monzo client_secret —
  org.springframework.web.client capped at INFO in dev.
- **Browser-facing raw JSON on callback failures**: replayed/invalid state (hit twice via
  cross-device replays) returned 400 JSON in the tab — browser navigations now redirect to
  /app/connect?monzo=error with a friendly retry phase; JSON contract unchanged for API
  clients (tests updated + new redirect test).
- **favicon.ico 500 → 404** (finding #8 from the #11 debug session — finally fixed:
  NoResourceFoundException handler).
- **Cross-device Monzo consent observed live**: phone completed consent (Monzo's own email
  login), state carried identity, connection created correctly; phone dead-ended on
  localhost redirect (prod domain fixes this); laptop's connect page derived phases from
  live state. Confirms the "return to your other device" icebox note; Access clarification:
  the callback is browser-issued, so it passes the Access gate — only webhooks need bypass.
