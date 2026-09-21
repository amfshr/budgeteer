# Design Session 03 — Supporting Views (entry, auth, shell, settings)

> 2026-09-21 · follows [design-session-02-user-stories.md](design-session-02-user-stories.md)
> Scope: everything AROUND the core money views — landing/root, the full auth state map,
> the shell/widget layouts, and a deep settings pass. Core transactions / pots / balances
> views get their own Session 04.
> Decisions numbered continuing from Session 02 (dec 35+). Status: **COMPLETE
> 2026-09-21** — turns 5–8 done, decisions 35–43 logged (43 = post-session 4d
> amendment), canvas + `support.js` vendored, project CLAUDE.md updated (ink-first
> fix, auth-copy rule, widget contract).
> Canvas is readable from Claude Code via DesignSync `get_file` (project
> `69558837-ecc1-4766-a300-76634a6a7630`) — reviews no longer need manual exports.

## Format & process (settled for this session)

- **Medium: claude.ai/design, the SAME project as before** (the one holding turns 1–4).
  Continuing in it means the 3e ink-first baseline, brand kit and prior screens are already
  in context — each brief just says "on the 3e baseline" the way turn 4 did.
- **Archive of record: the vendored canvas export** at
  `.agents/notes/product/design/budgeteer.dc.html`. At session end, re-export and replace.
  ⚠️ The current export references `./support.js` which was never vendored — grab it this
  time so the file renders standalone.
- **No separate wireframe stage.** The design language is decided (dec 32, 3e ink-first);
  wireframes would add a translation step with no audience (solo dev). Where layout is
  genuinely undecided (turn 7), ask the canvas for **grayscale structure-only options
  first**, then apply 3e to the winner — that's wireframing inside the platform.
- **Optional end-step:** distill the stable pieces (tokens, type, buttons, status pills,
  widget frame, shell chrome) into a claude.ai **design-system project** via Claude Code's
  DesignSync tool, so Session 04 and future platform work consume real components instead
  of re-describing the palette. Decide at the end (see checklist).
- **Loop per turn:** paste the brief → let it render options → walk the review checklist
  here → log the decision in the table below → next turn. To get Claude Code eyes on a
  turn mid-session: screenshot the option(s) into the chat, or re-export the canvas into
  the design folder for it to read.

## Canvas inventory (what already exists)

| Turn | Options | Contents |
|------|---------|----------|
| 1 | 1a–1m | Overview / Transactions / Connect ×4 / Login email (1g) + link-sent (1h), mobile light; dark set (1i–1k); desktop (1l–1m) |
| 2 | 2a–2c | This-month-vs-target · pots tree with rollups · month-end remainder |
| 3 | 3a–3e | Palette exploration — **3e zinc+emerald ink-first chosen (dec 32)** |
| 4 | 4a–4h | Settings (4a) · connected banks (4b) · connection detail (4c) · delete-account (4d) · unlink (4e) · OTP code entry ×3 (4f–4h) |

## Gaps this session closes

- **No landing/root exists at all** — the app currently opens straight into login (1g).
- **Auth is happy-path only**: no expired/used-link state, no wrong-code / attempts-exhausted,
  no resend-with-cooldown, no rate-limited state (the pre-#17 rate-limit task defines a
  `RATE_LIMITED` envelope the form must render), no session-expired interstitial (the
  2026-09-20 per-request session-validation decision means tokens can die mid-use), and
  **no passkey designs** (dec 8: passkeys post-MVP as fast re-auth; magic link stays
  registration + recovery).
- **Shell**: one fixed dashboard layout; the widget frame was never specified as a
  component even though dec 27 says v1 blocks are built widget-shaped and dec 18 records
  the customisable-dashboard vision. No customize-mode design.
- **Settings**: mobile-only (no desktop layout); no sessions/devices screen; the export and
  delete journeys end at the dialog — nothing after "confirm".

---

## Turn 5 — Landing / root (unauthenticated)

**Goal:** decide what a signed-out visitor at `/` sees, and whether `/` is a page at all or
a redirect to `/login`. Context that shapes it: Cloudflare Access (dec 14) sits in front,
so in practice only Alexander passes — but the portfolio reframing (docs-site backlog row)
gives the page a second audience via screenshots/demo.

**Paste-ready prompt:**

> Turn 5 — Landing / root, on the 3e baseline. Budgeteer has no unauthenticated root — the
> app opens at the login screen (1g). Design the signed-out front door. Three directions,
> mobile 390×844 each, plus one desktop rendering of whichever you'd pick:
> (5a) **Brand door** — wordmark, one quiet sentence, a single Sign in button. Private
> software; no marketing.
> (5b) **Product hero** — the portfolio angle: wordmark, one-line pitch, a shrunk
> live-looking Overview excerpt (reuse 1a's blocks), Sign in + a secondary "API docs" link.
> (5c) **Split door** — brand door top, one honest strip beneath (e.g. "Synced with Monzo ·
> read-only · self-hosted") — between 5a's silence and 5b's pitch.
> All: footer line "Read-only by design — Budgeteer never moves money." No social proof,
> no pricing, no testimonials, no fake logos.

**Review checklist:** does 5b's screenshot-of-the-app hold up when the real Overview
changes? Does 5a feel broken/unfinished rather than quiet? Dark variant of the winner.

**Log:** dec 35 — root route (`/` page vs redirect) + chosen direction.

## Turn 6 — Auth flows: the complete state map

**Goal:** every state the auth surface can be in, so magic-link polish, auth-v2 phase 1
(OTP) and passkeys (phase 2) can all be built without another design pass.

**Paste-ready prompt:**

> Turn 6 — Auth states, on the 3e baseline, extending 1g/1h (email → link sent) and 4f–4h
> (code entry). Mobile 390×844 unless said. Design:
> (6a) Magic link **expired/already-used** landing — calm, one-tap "send a new link".
> (6b) Code entry — **attempts exhausted** (wrong code ×N): boxes locked, "request a new
> code" path; distinct from 4g's single-error state.
> (6c) **Resend with cooldown** on the link-sent screen — countdown affordance, where the
> resend confirmation appears.
> (6d) **Rate-limited** (server returns RATE_LIMITED): the login form rendering a 429
> without blaming the user; when it clears.
> (6e) **Session expired** interstitial — mid-use revocation (logged out on the server):
> the screen you land on, keeping it obvious nothing was lost.
> (6f) **Passkey sign-in** — email field with passkey autofill affordance + explicit "Sign
> in with a passkey" secondary; the fallback link to email code. (Passkeys = fast re-auth;
> email remains registration + recovery — reflect that hierarchy.)
> (6g) **Passkey enrolment nudge** — first screen after a successful email login offering
> "add a passkey for next time", skippable, never a wall.
> (6h) **Passkeys in Settings** — a row/screen listing passkeys (name, created, last used)
> with rename/revoke, consistent with 4a's grouped-list style.
> Copy tone throughout: plain words, consequence first, never blame the user.
> Carry the 5c door treatment (mark + wordmark header) onto these screens where a header
> exists. Also: a **dark variant of the 5c door, mobile** — the one item left from turn 5.

**Review checklist:** do 6a–6e share one visual grammar for "something's off" (not five
different error styles)? Is the passkey path visibly optional? Does 6h fit the 4a list
idiom without new components?

**Log:** dec 36 — error-state grammar + copy tone; dec 37 — passkey placement in the login
surface (autofill-first vs button-first) and the enrolment moment.

**Follow-up ran 2026-09-21 (security copy redline, dec 36):** paste-ready amendment —

> Copy amendment to 6b/6d/6e — same layouts, security redline: never document the defense
> mechanism, only the next action.
> 6b: title "That code is no longer valid"; body "For safety we've retired it — a fresh
> code will work straight away." (drop the "five tries" count).
> 6d: keep "Give it a minute" + the countdown, body becomes "Too many recent sign-in
> attempts, so we've paused them briefly. Try again shortly." (drop "from this
> connection" and "nothing you did caused this"). Keep the "a link or code from earlier
> still works" line.
> 6e: body becomes "Your session has ended. Nothing was lost — your data is exactly as
> you left it." (drop the cause list). Keep the "we'll take you back to Transactions"
> line.
> 6a and 6c stay as they are.

## Turn 7 — Shell & widget-frame play

**Goal:** specify the widget frame as a component and stress the layouts that hold widgets
and pages, ahead of dec 18's customisable dashboard. Structure first, style second.

**Paste-ready prompt:**

> Turn 7 — Shell & widget frame, on the 3e baseline, extending 1a/1l (Overview mobile +
> desktop). Two parts.
> Part 1 — **widget frame anatomy** as a standalone spec card: header (title + optional
> range), primary value (tabular-nums), delta/context line, optional sparkline, footer
> action; then the same frame in **loading (skeleton)**, **empty**, and **error** states.
> One frame, four states, side by side.
> Part 2 — **layout structures, grayscale only** (no palette, boxes and labels): (7-i) the
> current fixed 4-block stack; (7-ii) desktop 2-column bento — big balance/spend cards +
> narrow rail; (7-iii) denser 3-column grid for many small widgets. Then apply 3e to the
> winner only, mobile + desktop.
> Part 3 — **customize mode, one screen**: the chosen layout in edit state — drag handles,
> remove, an "add widget" sheet listing widget types. Design it now so v1's fixed blocks
> don't paint us out of it.

**Review checklist:** does the frame survive its smallest slot (mobile half-width)? Do
skeleton/empty/error read as the same component? Does the desktop nav (slim top bar, 1l)
still hold with a denser grid, or does this reopen sidebar-vs-topnav?

**Log:** dec 38 — widget frame contract (slots + states); dec 39 — dashboard grid + whether
customize-mode changes the v1 build order.

## Turn 8 — Settings, deep + desktop

**Goal:** finish the settings surface so #15 (settings & data rights) can be grilled and
built against designs, and give settings a desktop layout for the first time.

**Paste-ready prompt:**

> Turn 8 — Settings deep pass, on the 3e baseline, extending 4a–4e. Design:
> (8a) **Settings — desktop**: the 4a grouped list at 72rem — left section rail vs single
> centered column; pick one and show it.
> (8b) **Appearance picker** — System / Light / Dark, matching the 4a row that hints it.
> (8c) **Sessions & devices** — current session (device, browser, signed-in since),
> "sign out other devices"; single-session today, but per-request validation (2026-09-20)
> makes revocation instant — design for the list.
> (8d) **Export journey** — after 4a's Download: preparing → ready (file size, JSON) →
> done; inline on the row, not a modal takeover.
> (8e) **Delete + purge journey** — what follows 4d's typed confirm: purging progress
> (data, sessions, Monzo consent revoked), then a signed-out goodbye screen. Consequence
> stays front and center.
> (8f) **Connection row sync states** — the Sync-now button (already built) in idle /
> syncing / just-synced / failed, on the 4c connection detail.
> (8g) **About** — version, licenses, "self-hosted by you" note; the quietest screen in
> the app.

**Review checklist:** does desktop settings reuse the mobile cards or become a different
idiom? Is 8e's progress honest about async steps (consent revoke can fail — show it)?
Does 8f agree with the built implementation's states?

**Log:** dec 40 — settings desktop IA; dec 41 — sessions screen scope (feeds the #15
grill); dec 42 — export/delete journey states.

---

## Decision log (fill during the session — numbering continues from 34)

| # | Turn | Decision | Why | Rejected |
|---|------|----------|-----|----------|
| 35 | 5 | Root `/` is a real page: **5c split door** (5d desktop) — mark + wordmark, one line, strip `Monzo · Read-only · Self-hosted`, ink Sign in. **Emerald wordmark dot stays** — the marks are the brand (dec 33/34; brand README: bowl/square = "the money part"); 3e ink-first disciplines controls, not the marks | Middle ground between 5a's silence and 5b's hero; dot ruling grounded in shipped assets (Wordmark.tsx, favicon, email) | 5a brand door, 5b product hero. Strip copy is placeholder: goes provider-agnostic at build ("your bank" — TrueLayer later); "never moves money" footer stands until product direction actually changes |
| 36 | 6 | **One "something's off" grammar** (6a–6e): muted status card, one line-icon, plain title, one consequence sentence, single ink action. No red/amber in auth; emerald once (6g signed-in). **Security copy rule: state the next action, never the mechanism** — no attempt thresholds (6b's "five tries"), no limiter dimension (6d's "from this connection"), no session-end cause list (6e's "ended from another device"). Countdown timers OK (retry time already travels in the 429 envelope — secrecy there is theater); link TTL ("once, 15 minutes") OK — user education, not exploitable; "older links/codes no longer work" (6c) and "a code from earlier still works" (6d) OK. Standing rule: link-sent/code screens never confirm whether an address is registered (1h already complies) | Server still enforces the real thresholds; copy just stops documenting them for attackers. Alexander flagged the over-disclosure 2026-09-21 | Verbatim-honest error copy (leaks limiter shape); fully generic "an error occurred" (hostile to the one real user) |
| 37 | 6 | **Passkeys: autofill-first in the email field, outlined "Sign in with a passkey" secondary; email stays the primary path** (registration + recovery, dec 8). Enrolment = post-login skippable nudge (6g), re-offered after a month, always available in Settings; passkey management = 4a-idiom grouped list (6h) with rename/remove, remove is the turn's only red. 5c door treatment carried onto auth headers; 6i dark door closes turn 5 | Hierarchy mirrors the auth architecture — passkey is convenience, email is truth | Passkey-primary login; enrolment as a blocking wall |
| 38 | 7 | **Widget frame contract (7a): every Overview card is an instance.** Five slots — header + optional range / ONE primary value (30/600, tabular) / context line (the only slot allowed emerald or red words) / optional 36px ink sparkline / footer text-action above a hairline, whole card the hit target. Radius 14, pad 18; spans: rail 1 · wide 2 · list 4; tall list variant drops slots 2–4. States: skeleton = same slot geometry, no shimmer; **empty = true zero** (£0.00 stays, muted); **error = em-dash + "showing figures from HH:MM" + Retry, never red**. v1's four fixed blocks are already frame instances with a fixed order | Cashes in dec 27 ("blocks built widget-shaped") as an explicit contract the build can implement against | Per-card bespoke layouts; red error states |
| 39 | 7 | **Layout = 7-ii bento** (tracks 2+2+1; under 720px everything full-width → the 7-i stack — one layout, not two). 7-iii dense grid kept only as the density to grow into at 9+ widgets. **Customize mode (7e) PARKED**: v1 ships fixed order (dec 27 holds); drag-and-drop rejected — touch-native idiom, and it demands a second interaction model on mobile (the canvas itself proposed "long-press + reorder sheet"). When configurability comes (post-#19): keep the add-widget sheet, replace dragging with show/hide + up/down ordering — one model on both form factors. **Parked to #19 / Session 04**: the provisional Pots 4th tab (CLAUDE.md's "(Pots)"), the month-end "allocate" widget action (§2a money semantics), and ALL pot setup/management flows — tree depth, splits, pot-vs-category vocabulary must be decided before screens | Alexander 2026-09-21: hasn't thought pots interaction through; won't over-engineer full customization. Matches the board: #19 needs /grill-me before build | Fully customizable v1; designing pot setup ahead of the model decisions |
| 40 | 8 | **Settings desktop IA (8a): left section rail + one content column, 4a mobile cards reused unchanged** — the rail is the mobile section headers turned into navigation (same idiom, not a second one). Rail: Account (Appearance · Sessions & devices · Passkeys) / Connected banks / Data & privacy / About. Log out labeled "this device only". Appearance (8b): System · Light · Dark, saved per device | Reuse over reinvention; centred column at 72rem = 900px rows or mobile-in-a-desert | Single centred column; bespoke desktop components |
| 41 | 8 | **Sessions & devices (8c) designed multi-device**: current device pinned, per-device sign-out, "sign out all other devices", effect-immediate copy with no mechanism leak. **⚠️ Open policy question for the #15/auth-v2 grill: backend is SINGLE-session since #14** (each login revokes the last; pre-#14 the app was multi-session). Passkeys-per-device (6f–6h) pulls toward concurrent sessions — grill decides: relax to multi-session (8c as designed) vs keep single-session (8c collapses to current-device + "previous sign-ins end automatically"). Canvas "try next" sign-out-all confirm sheet parks with the same decision | Designing the fuller model was deliberate — collapsing is cheap, retrofitting isn't | Pretending the policy question doesn't exist |
| 42 | 8 | **Export & delete journeys reuse the turn-6 status grammar.** Export (8d): inline on the row, idle→preparing→ready→done; "ready 10 min then discarded" implies a server-held artifact — **grill decides async-job+TTL vs plain synchronous stream** (design reads fine either way); done-tick is foreground, not emerald — "an export isn't money". Delete (8e): ordered steps — sessions out → Monzo revoke attempted → erase → account removed; **revoke failure never blocks the purge** — goodbye screen gets a "one thing to check" card with the manual Monzo-side path only when revoke didn't confirm; no red on either screen; the numeric purge counter (1,204/1,972) is optional fidelity the grill may simplify to steps-only. Sync-now (8f): idle/syncing/just-synced/failed map 1:1 to the built button; failed keeps the last good time + "hourly sync continues" (same rule as the widget error state). About (8g): version · host · licences · self-hosted paragraph | Journeys past the confirm dialog were the #15 gap; honesty-about-async was the checklist bar and 8e clears it | Modal-takeover export; blocking purge on a third-party revoke; red on the goodbye screen |
| 43 | 4d amendment | **Delete dialog rebuilt on GitHub-settings patterns** (Alexander's reference, github.com/settings/admin, 2026-09-21): consequence prose → **will/won't ledger** ("We will erase… / We will end Monzo's access… / We will not be able to recover anything afterwards"); **de-escalation block** above the confirm ("Only want to stop syncing? Disconnect Monzo instead — your data stays. Want a copy first? Export runs from Data & privacy" — plain links, not buttons); typed confirmation upgraded from a single word to the exact phrase **"delete my account"**; cancel reads **"Keep my account"**. Voice stays calm-precision. GitHub also validated (no change needed): 8a rail idiom = their grouped settings nav; 8d export-with-TTL = their "available for 7 days" | A ledger scans at the exact moment users skim; the lesser action belongs inside the destructive flow; a phrase is a more deliberate act than a word | GitHub's two-field confirm (username + phrase — overkill single-user); their alarmist "unexpected bad things" voice; rail group headers (not needed at 7 items) |

## End-of-session checklist

- [x] Canvas + `support.js` vendored to `.agents/notes/product/design/` (pulled live via
      DesignSync 2026-09-21 — no manual export needed)
- [x] Decision log filled (35–42); session status COMPLETE
- [x] `.agents/context/project.md` + `tasks.md` rows updated: #15 gains canvas refs
      8a–8g (+ the 8c session-policy flag), auth-v2 gains 6a–6h, widget-dashboard
      backlog row gains 7's frame contract
- [ ] Decide: sync a design-system project (brand kit + frame + chrome) via DesignSync —
      yes/no; if yes, do it from the repo so it stays source-of-truth. NOTE: the current
      claude.ai project is a REGULAR project type — a design-system project must be
      created fresh (`create_project`); pushing to the existing one can't convert it
- [ ] Session 04 booked: **opens with the pots interaction model** (the dec 39 parked
      list: setup/management flows, Pots tab yes/no, allocate action — run `/grill-me`
      on #19 alongside), then core money views (transactions, pots/balances) on the
      new shell. **Method (Alexander 2026-09-21): grill first → grilled spec becomes
      the detailed design requirements → Session 04 briefs are written FROM the spec**
      (and uploaded to the design project's `uploads/product/`, like this session's
      doc), so the canvas designs against binding decisions, not sketches
