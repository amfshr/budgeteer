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
- [ ] Chrome (dec 26): AppLayout → bottom tab bar on mobile (Overview · Transactions ·
      Settings placeholder), slim top nav ≥sm; active states; logout moves to Settings-ish
      corner
- [ ] Dashboard v1 (dec 27): four widget-shaped blocks — Balance (total + per-account,
      as-of), This month (MTD out via the summary API — first consumer!), This week,
      Recent transactions
- [ ] `/app/connect` onboarding (dec 28): four phases — explainer/CTA → "approve the push
      in your Monzo app" → importing w/ live count → green success ✓ → overview. Server
      callback redirect target updated to `/app/connect`; overview drops all connect
      states/banners
- [ ] Tx polish (dec 31): date group headers (Today/Yesterday/…), income in green
      (new `money-positive` theme token), pending badge, account filter dropdown
- [ ] Account display name (dec 30): mapping-level sane default ("Monzo Current Account")
      when displayName looks like an id — server-side in MonzoIngestor/mapper
- [ ] Settings tab placeholder page (destination exists per dec 26; #15 fills it)
- [ ] Tests updated/extended; all gates green

**Visual (after Alexander's claude.ai/design pass with the Branch-B brief):**
- [ ] Apply branding: lowercase wordmark, emerald accent token wiring, spacing/typography
      refinements from the design output (adapted onto tokens, never pasted)

## Non-goals

Targets/pots UI (#19), popup consent (auth-v2), widget configurability (post-#19).
