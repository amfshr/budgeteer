# Design Session 02 — User Stories & Money Views

> 2026-09-19 · follows [design-session-01-top-down.md](design-session-01-top-down.md)
> Context: #16 functional slice live (real accounts/transactions render); this session decides
> stories → chrome/IA → dashboard v1 → connect onboarding → view polish → branding brief.
> Decisions numbered continuing from Session 01 (dec 22+). Status: IN PROGRESS.

## Branch S — User stories (Alexander, verbatim-distilled)

**The money model (as lived today):**
- One income → Lloyds. Outgoings from Lloyds: rent, credit-card clear, money box, student
  loan, rainy-day fund, gas/electric, subscriptions.
- A monthly chunk (~£200–400) transferred Lloyds → Monzo = the month's day-to-day spending;
  habit is "make it last", un-systematic — wants Budgeteer to make the monthly routine
  mechanical and systematic.
- Desired high level: **targets per outgoing/pot; month-end remainder → savings as a bonus.**

**S1 — the phone glance:** "How is my spending tracking against this month's targets/pots?"
Useful ranges: **weekly + monthly** (yearly analysis = laptop). Expects LOW app-opening
frequency — the glance must pay off instantly.

**S2 — the ritual:** no real budgeting today (Excel totting years ago, lapsed). Monthly, on
payday, laptop: check salary landed → rent, credit card, money box, student loan → chunk to
Monzo. Config (pots/targets) will live here: roughly monthly, laptop.

**S3 / product identity:** Budgeteer is a **budgeting platform, not payments
infrastructure** — views + flexible customisation, built up over time, core views first.

**The classification vision (the Proton Mail analogy):** full ownership of what/why payments
were made, downstream of Monzo, not reliant on its categorisation. Two mechanisms like
folders vs labels: exclusive placement vs non-exclusive tagging. Custom categories; pots or
track-by-category; **hierarchy** (flat pots don't scale — some tiny, some load-bearing;
tree/graph of pots-budgets) — but "the actual amount in a pot must stay sensible, not an
abstract number". Open tension he named: pizza = eating AND free-choice — can one payment
"reduce more than one pot"?

## Distilled stories (the spec everything traces to)

| # | Story | Cadence | Device |
|---|-------|---------|--------|
| ST1 | Glance: am I on track vs this month's targets, per pot/category? | daily-ish | phone |
| ST2 | See week + month spending shape (totals, by category) | weekly | phone/laptop |
| ST3 | Payday ritual: set/adjust targets & pots for the new month | monthly | laptop |
| ST4 | Own the meaning of every transaction (categorise, annotate) — independent of Monzo | ongoing | both |
| ST5 | Month-end: see the remainder → celebrate it moving to savings | monthly | both |
| ST6 | Yearly/deep analysis | rare | laptop |

Never-story: initiating payments/transfers from Budgeteer (views + tracking only; actual
money movement stays in the banks' apps).

## Decisions (continuing Session 01 numbering)

| # | Branch | Decision | Why / rejected |
|---|--------|----------|----------------|
| 22 | S | **Pots exclusive, labels free** — a payment debits exactly ONE pot, or an amount-SPLIT across pots (conserves); labels/categories are unlimited non-exclusive tags for analytics (pizza = #eating + #free-choice). Pots=folders, labels=labels (Alexander's Proton analogy, applied) | Rejected: full-amount multi-pot debits (breaks §2a conservation — the "abstract number" fear); pots-only (loses cross-cutting views) |
| 23 | S | **Pot hierarchy = tree with rollups** — payments sit in leaves; parents are computed subtree sums (Essentials ▸ Gas/Electric…). Cross-cutting views that a tree can't express are labels' job | Rejected: DAG (double-counting rollups); flat (he already hit the scaling wall conceptually) |
| 24 | S/F | **Pots+categories epic promoted: queued immediately after the Session-02 visual polish** — ST1/ST3/ST5 all depend on it; the glance IS the daily use the old gate was waiting for. Dashboard v1 ships thin on existing APIs meanwhile | Rejected: pots-first-before-polish (polish would slip forever); keep parked (chicken-and-egg) |
| 25 | S | **Budgeteer never initiates payments** — budgeting platform: views, tracking, classification. Money movement stays in the banks' apps. (Product-level confirmation of the existing PaymentInitiation-stays-separate architecture note) | — |

**Scope line noted:** ST1's FULL vision (targets over rent/student-loan/etc.) spans Lloyds —
TrueLayer territory, still parked. Monzo-only v1 tracks the monthly spending chunk +
whatever pots Alexander models manually; that's enough to prove the loop.
| 26 | C | **Chrome: bottom tab bar (mobile) / slim top nav (desktop)**; destinations Overview · Transactions · Settings, +Pots when built. Derived from the stories (4 stable destinations, glance-first phone) — money-app convention | Rejected: sidebar (4 items = empty console chrome), drawer (2 taps per nav), hub-only (buries transactions) |
| 27 | D | **Dashboard v1 = fixed four-block stack**: Balance (total + per-account, as-of) · This month (MTD spend — summary API, targets plug in post-pots) · This week · Recent transactions. Each block a self-contained card ("widget-shaped") seeding the future pick-and-choose dashboard without building configurability | Rejected: thinner (week returns anyway), richer (needs pots) |
| 28 | O | **/app/connect four-phase onboarding page**: explainer+Connect → "approve the push in your Monzo app" (covers the SCA-retry silence) → importing w/ live count → green "sync complete ✓" → overview. Callback redirects here; overview loses all connect states | Rejected: banners-on-dashboard (proven confusing live 2026-09-17) |
| 29 | O | **Consent: full-page redirect stays for v1; popup-window upgrade rides auth-methods-v2 polish.** iframe permanently impossible (X-Frame-Options) | Rejected: popup now (popup-blockers + cross-window messaging = scope) |
| 30 | V | **Account naming: mapping-level sane default now** ("{institution} {type}" when displayName looks like an id); user-editable nicknames join the pots-epic settings work | Rejected: nickname feature now (needs PATCH + UI) |
| 31 | V | **Transaction list polish set (all four)**: date group headers (Today/Yesterday/…), income in green via a new money-positive token, pending as a subtle badge, account filter dropdown | — |
| 32 | B | **Branding: lowercase `budgeteer` wordmark (Geist); calm-precision tone; zinc near-mono base + EMERALD accent** (positive money, on-track targets, primary actions; red reserved for destructive/over-budget); light AND dark first-class, system-follow default | Rejected: warm/friendly (toy-like for money), dense pro-tool (wrong for glance), dark-first (sunlight glance), blue accent (money-positive needs green anyway) |

## The claude.ai/design brief (Branch B output — paste into the design tool)

> **budgeteer** — a personal budgeting web app (React + Tailwind v4 + shadcn/ui, Geist font).
> Tone: **calm precision** — quiet, trustworthy, numbers-first; generous whitespace, tabular
> figures; the reference family is Resend / Mintlify / Linear, NOT Monzo's playfulness.
> Palette: zinc/neutral near-monochrome base, **emerald as the single accent** (positive
> amounts, on-track indicators, primary buttons); red only for destructive/over-budget;
> light and dark modes both first-class. Mobile-first.
> Screens to design: (1) **Overview** — bottom-tab app shell; stacked cards: total balance
> w/ per-account chips + "as of" stamp; "This month" spend card; "This week" card; recent
> transactions list with date group headers, income in emerald, subtle pending badges.
> (2) **Transactions** — full list, date headers, account filter, pagination. (3)
> **Connect onboarding** — 4 phases: explainer/CTA; "approve the push notification in your
> Monzo app"; importing progress with live transaction count; green success ✓.
> (4) **Login** — email → magic-link sent (existing flow, restyle only).
> Desktop = same pages, slim top nav instead of bottom tabs, content max-width ~72rem.
> Output as Tailwind/shadcn-flavoured components; will be adapted onto existing theme tokens.

## Epics & build order (post-#16)

| Epic | Contents | Depends on | Grill? |
|------|----------|-----------|--------|
| **#18 E6 Views polish & shell** | Chrome (bottom tabs/top nav, dec 26) · dashboard v1 stack (dec 27, consumes the unused summary API) · /app/connect onboarding (dec 28) · tx polish set (dec 31) · account-name default (dec 30) · branding token application AFTER Alexander's claude.ai/design pass (dec 32) | #16 merged; design pass for the visual layer (structure can start before it) | No — this doc is the spec |
| **#19 E7 Pots, targets & labels** | The dec 22/23 model: pot tree w/ rollups, amount-splits, free labels, monthly targets, payday config flow (ST3), month-end remainder story (ST5); account nicknames | #18; **/grill-me REQUIRED** (schema: pots/splits/labels/targets + §2a invariants + dec 22/23 as constraints) | **Yes — first** |
| Then | #15 data rights (Settings tab exists from #18) → #17 edge/deploy → auth-methods-v2 phase 1 | | #15 needs its /grill-me too |

## Session close

**Five-bullet summary:** (1) The money model is decided: pots = exclusive money-holding
folders in a TREE with rollups + amount-splits; labels = free tags — conservation holds by
construction. (2) Chrome derived from stories: bottom tabs / top nav, four destinations.
(3) Dashboard v1 = thin four-block widget-shaped stack on existing APIs; targets plug in
at #19. (4) Connect becomes a guided four-phase onboarding page. (5) Branding: calm
precision, zinc + emerald, lowercase wordmark — brief ready for the design tool.

**Open questions parked:** TrueLayer timing vs the full-ST1 vision (targets across Lloyds
outgoings); pot auto-assignment rules (merchant → pot) — #19 grill material; widget
dashboard configurability — after #19 proves the blocks; cross-device handoff ladder
(auth-v2 epic); pending-fossil fix scheduling (independent, P2, any time).

**Next actions:** Alexander merges PR #95 → runs the design brief through claude.ai/design
→ #18 build (structure first, visuals on design output) → /grill-me #19.
