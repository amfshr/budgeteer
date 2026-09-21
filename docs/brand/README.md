# budgeteer brand

Source of truth: the claude.ai/design project (`69558837-ecc1-4766-a300-76634a6a7630`),
files `brand/Brand.dc.html` (brand sheet) and `budgeteer.dc.html` (app screens).
Local copies of the canvases live in `.agents/notes/product/design/`.

## The mark

The lowercase **b** reduced to two parts — a stem and a bowl — with the bowl in
emerald so the accent means what it means everywhere in the app: the money part.
Geometry (64-unit grid): tile `rx 14` `#18181b`; stem `x20 y12 w8 h40 rx4` `#fafafa`;
bowl `circle cx35 cy40 r10 stroke-width 8` `#34d399` (emerald-400 on dark tile;
`#059669` emerald-600 on the light tile).

- `mark.svg` — dark tile (primary)
- `mark-light.svg` — light tile
- `mark-mono.svg` — currentColor glyph, no tile (print / single-colour)

## Wordmark

Live text, never an image: lowercase `budgeteer`, semibold, tracking −0.02em, plus a
baseline-aligned emerald square (0.28em, radius 0.08em, gap ~0.05em). Implemented as
`budgeteer-web/src/components/Wordmark.tsx`. Lockup with the mark: mark height = cap
height, gap 0.5em.

## Shipped assets

`budgeteer-web/public/`: `favicon.svg` (theme-adaptive: dark tile on light tabs,
bare glyph on dark), `icon-16/32/192/512.png`, `icon-512-maskable.png` (glyph at
0.85 for the safe zone), `apple-touch-icon.png` (full-bleed — iOS rounds corners),
`site.webmanifest`. Regenerate from the geometry above via headless Chrome
(ImageMagick's internal SVG renderer mangles the bowl's arcs).

The magic-link email template lives in `EmailService.buildMagicLinkHtmlBody`
(adapted from `brand/email-magic-link.html`; its OTP-code section arrives with
auth methods v2).
