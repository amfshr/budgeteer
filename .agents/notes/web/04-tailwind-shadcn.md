# Web 04 — Tailwind & shadcn/ui, via our own code

> Previous: [03 — The shape we'll grow into](03-frontend-shape.md)
> Specimens: `src/features/auth/LoginPage.tsx`, `src/layouts/AppLayout.tsx`,
> `src/components/ui/button.tsx`, `src/index.css`. Open them alongside.

## 1. Tailwind: the idea

Traditional CSS: write a stylesheet, invent names (`.login-card`), connect markup to styles
by name, fight the cascade when rules collide. Tailwind deletes the naming step: you compose
**utility classes** — each mapping to essentially one CSS declaration — directly in the
markup. There is no stylesheet to keep in sync; the styling *is* where the element is.

Why this is not "inline styles with extra steps" — three things `style=""` cannot do:

1. **A constrained scale.** `px-4` isn't "some padding", it's step 4 of a fixed spacing
   scale (1 step = 0.25rem, so `px-4` = 1rem, `py-3` = 0.75rem). Every gap in the app comes
   from the same scale, which is why it looks coherent without a designer.
2. **Prefixes for states and screens.** `hover:bg-muted`, `focus-visible:ring-3`,
   `disabled:opacity-50`, `md:flex-row`, `dark:bg-input/30` — conditional styling composed
   in place. Inline styles can't express hover, media queries, or dark mode at all.
3. **The build step.** Tailwind v4 scans the source, emits only the utilities actually used
   — our whole CSS is ~25KB where Bootstrap shipped 230KB.

## 2. Reading a class string (the actual skill)

From `AppLayout.tsx`'s header:

```
mx-auto  flex  max-w-5xl  items-center  justify-between  px-4  py-3
```

Word by word: horizontally centre the box (`margin-inline: auto`) · make it a flex container
(children lay out in a row) · cap its width at the `5xl` step (~64rem) · vertically centre
the children (cross axis) · push children to opposite ends (main axis — brand left, logout
right) · horizontal padding step 4 · vertical padding step 3.

That one line is the entire "navbar layout". The flexbox mental model you need for 90% of
layouts: parent gets `flex` (+ `gap-N`, `items-*` for cross-axis, `justify-*` for main
axis); children just exist. `flex-col` turns the row into a column.

**Mobile-first responsiveness**, live in our header: the signed-in email is
`hidden sm:inline` — bare utilities target phones (hidden), prefixed ones switch on at
breakpoints (`sm:` = ≥640px shows it). Design for the phone, add for the laptop — never the
reverse.

Other recurring vocabulary in our pages: `space-y-8` (vertical gap between children),
`w-full max-w-sm` (fluid width, capped), `text-4xl font-bold tracking-tight` (type scale,
weight, letter-spacing), `animate-spin rounded-full border-2 border-t-transparent` (the
spinner: a circle with one transparent border edge, rotating), `min-h-svh` (at least the
small-viewport height — the mobile-safe full-screen).

## 3. Theme tokens — OUR palette, not Tailwind's

`text-muted-foreground`, `bg-background`, `border-border`, `bg-primary` are not stock
Tailwind — they're **our tokens**, defined as CSS variables in `src/index.css` (`:root` for
light, `.dark` overrides for dark, oklch colour space, Geist font, radius scale).

The rule that keeps the app themable: **reach for tokens, not raw palette classes.**
`text-muted-foreground` follows dark mode and future branding automatically;
`text-zinc-500` is a hardcode that breaks both. When Design Session 02 produces branding,
it lands as *token edits in one file* and the entire app — every shadcn component included —
re-skins itself. That's the mechanism the design session will plug into.

## 4. shadcn/ui: a component distributor, not a dependency

`npx shadcn add button` does not install a library — it **copies source code** into
`src/components/ui/button.tsx`. We own that file: editable, greppable, debuggable, no
version upgrades, no waiting for a maintainer. The trade: updates don't flow automatically
(fine — these are commodity components).

What the generated components are made of:

- **Radix primitives** (the `radix-ui` package) supply the *behaviour and accessibility*
  you'd get wrong by hand — focus trapping, aria attributes, keyboard handling. Invisible
  until you add a Dialog/Dropdown, where it's the hard part.
- **Tailwind classes** supply all *appearance* — styled with our tokens (`bg-primary`,
  `border-border`), which is why theming works.
- **`cva`** (class-variance-authority) organises the class strings into **variants** —
  look at `buttonVariants` in button.tsx: a base string plus `variant` (default, outline,
  ghost, destructive, link…) and `size` (xs…lg, icon) maps. Usage reads declaratively:
  `<Button variant="outline" size="sm">` — that's the logout button.
- **`cn()`** (from the `cn` package, re-exported in `src/lib/utils.ts`) merges class
  strings *with conflict resolution*: `cn('px-2', className)` lets a caller override
  padding and the later one genuinely wins (plain string concat would leave both and let
  CSS order decide).

Two patterns from our code worth recognising:

- **`asChild`** (VerifyPage): `<Button asChild><Link to="/">Back to sign in</Link></Button>`
  renders *one* element — the router `Link` wearing the button's classes — instead of a
  nested `<button><a>`. Radix's `Slot` does the merge. Use it whenever "a link that looks
  like a button".
- **`<Label htmlFor="email">`** isn't decoration: it wires the accessible label relation —
  which is exactly what our tests query (`getByLabelText('Email')`). Accessibility and
  testability are the same investment.

## 5. How it all connects (current login flow as the map)

```
index.css          tokens (light/.dark) ──────────┐
components/ui/*    shadcn components, styled with tokens
layouts/           PublicLayout (brand bar + centered outlet)
                   AppLayout (flex header, hidden sm:inline email, outline logout)
features/auth/*    pages composed FROM ui components + Tailwind layout utilities
```

Division of labour to internalise: **Tailwind utilities for layout and one-off styling;
shadcn components for anything interactive or repeated; tokens for every colour.** When a
new UI need appears, the order of reach is: existing `ui/` component → `npx shadcn add <x>`
→ compose utilities → (rarely) write CSS.

## 6. Docs worth ten minutes each

- Tailwind "Styling with utility classes": https://tailwindcss.com/docs/styling-with-utility-classes
- Tailwind "Responsive design": https://tailwindcss.com/docs/responsive-design
- shadcn "Theming": https://ui.shadcn.com/docs/theming
- cva: https://cva.style/docs
