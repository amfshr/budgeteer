# Web 02 — React & TypeScript primer (via our own code)

> Previous: [01 — Anatomy](01-anatomy.md) · Next: [03 — The shape we'll grow into](03-frontend-shape.md)
>
> Every example below is real code from `budgeteer-web/src/` — open the files alongside.

## 1. Components: functions that return markup

A React component is a plain function returning **JSX** — HTML-looking syntax that compiles
to function calls. Our simplest one, `pages/Home.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
      <p className="text-muted-foreground mt-2">
        Accounts and balances land here in the money-views milestone.
      </p>
    </main>
  )
}
```

Things to notice:
- Capitalised tags in JSX (`<Routes>`, `<Button>`) are *components*; lowercase tags
  (`<main>`, `<h2>`) are plain HTML elements. Capitalisation is how JSX tells them apart.
- `className`, not `class` (`class` is a JS keyword). The values are **Tailwind utility
  classes** — each maps to one CSS declaration (`px-4` = horizontal padding, `mx-auto` =
  centred, `max-w-5xl` = width cap). `text-muted-foreground` is one of OUR theme tokens
  (defined in `src/index.css`) — use tokens, not raw palette classes, so dark mode and
  future theming keep working.
- JSX is *values*: a component returns a description of UI, and React decides when/what to
  actually draw. Think of it as returning a lightweight DTO of the desired DOM.

## 2. Props: the constructor arguments of a component

Props are the inputs. In `App.tsx`:

```tsx
<Route path="/" element={<Landing />} />
```

`path` and `element` are props being passed to the `Route` component. `{curly braces}` embed
a JavaScript expression inside JSX — here, the element prop's value is *another component
instance*. When we write our own typed component it looks like:

```tsx
interface BalanceProps { minorUnits: number; currency: string }
function Balance({ minorUnits, currency }: BalanceProps) { ... }
// used as: <Balance minorUnits={9177} currency="GBP" />
```

Props flow **one way, downwards**. A child never mutates its props (they're effectively
`final`); if a child needs to tell a parent something, the parent passes a callback prop down.

## 3. State: the thing that makes the UI move

Where props are inputs from above, **state** is a component's own memory. The `useState`
hook (none in our code *yet* — #14 brings the first):

```tsx
const [email, setEmail] = useState('')
// email is the current value; setEmail(...) updates it AND re-renders the component
```

The whole React mental model in one sentence: **you never touch the DOM; you change state,
the component function re-runs, React diffs the output and patches the screen.**

"Hooks" (`useState`, `useEffect`, `useQuery`, …) are functions that give components
capabilities. One hard rule, enforced by our ESLint config: hooks are called unconditionally
at the top of the component — never inside an `if` or loop.

## 4. TypeScript through our API client — including a familiar friend

`src/api/client.ts` is the richest TS in the repo, and its core trick is one you already
shipped on the Java side. The server's envelope is modelled as:

```ts
interface ApiSuccess<T> { success: true;  data: T;               timestamp: string }
interface ApiFailure    { success: false; error: ApiErrorDetails; timestamp: string }
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure
```

That `A | B` is a **discriminated union** — the TypeScript equivalent of your sealed
interface. `SyncPosition` = `FromTime | AfterTransaction | NextPage` with an exhaustive
switch; `ApiEnvelope<T>` = `ApiSuccess<T> | ApiFailure` discriminated by the literal type of
the `success` field (not `boolean` — literally `true` or `false`). So in `request<T>`:

```ts
if (!envelope.success) {
  // in this branch the compiler has NARROWED the type to ApiFailure:
  throw new ApiClientError(envelope.error.code, envelope.error.message, response.status)
}
return envelope.data   // and here it MUST be ApiSuccess<T> — .data exists, typed T
```

No casting, no `instanceof` — the compiler follows the `success` check the same way `javac`
follows a sealed-switch. This pattern (model each shape precisely, discriminate on a literal
field) is the backbone of typed frontend code.

Other TS features on show in that file:
- **Generics:** `request<T>(path): Promise<T>` — caller picks the payload type:
  `get<AccountResponse[]>('/api/v1/accounts')`.
- **`unknown` over `any`:** `ApiErrorDetails` allows extra fields as `unknown` — you must
  type-check before using them. `any` (which disables checking) is banned by lint.
- **Type erasure in practice:** `(await response.json()) as ApiEnvelope<T>` is a *promise,
  not a proof* — nothing validates the JSON at runtime. Acceptable because we own both
  sides of the contract; the OpenAPI work (see 03) is what will keep the promise honest.
- **Module-level state:** `setUnauthorizedHandler(...)` registers one callback the whole app
  shares — when any request gets a 401 envelope, the handler fires (this becomes
  "redirect to login" in #14).

## 5. The bootstrap chain: `main.tsx`

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

Read inside-out: `App` is wrapped by **providers** — components that make a capability
available to everything beneath them (React's version of a DI container scope):
- `BrowserRouter` — enables routing against the real URL bar.
- `QueryClientProvider` — TanStack Query's cache, shared app-wide.
- `StrictMode` — dev-only checks (deliberately double-runs some code to expose bugs; no
  production effect).

The `!` after `getElementById` is TS's "trust me, not null" operator — fine here (the div is
hardcoded in index.html), suspicious anywhere else.

## 6. Routing: `App.tsx`

```tsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/app" element={<Home />} />
</Routes>
```

This is an SPA (single-page app): the browser loads `index.html` once, and "navigation" is
React Router swapping which component renders for the current URL — no server round-trip.
The route table will grow per epic (see 03). The navbar above `<Routes>` renders on every
page — that's the "shell".

## 7. The two libraries you haven't met yet

**TanStack Query** (waiting for #14/#16): manages *server state* — data that lives on the
backend and is merely cached in the browser. Instead of hand-rolling
fetch-then-setState-then-handle-errors in every component:

```tsx
const { data, isPending, error } = useQuery({
  queryKey: ['accounts'],
  queryFn: () => get<AccountResponse[]>('/api/v1/accounts'),
})
```

You get caching, deduplication, background refetch, and — crucially for the first-connect
UX (finding #6) — `refetchInterval` polling and cache invalidation
(`queryClient.invalidateQueries({ queryKey: ['accounts'] })` after an ingest completes).
The `queryKey` is the cache key; invalidating it is how "refresh the data in the GUI" works.

**Tailwind v4 + shadcn/ui** (amended from react-bootstrap, 2026-09-13): Tailwind provides
the utility classes and our theme tokens (`src/index.css` — colours, radii, the Geist font,
dark-mode variants); shadcn/ui provides *copy-in* components — `npx shadcn add button card
dialog …` drops accessible, Radix-based source files into `src/components/ui/` that we own
and can edit. Mobile-first works via breakpoint prefixes: bare utilities target small
screens, `md:`/`lg:` prefixes layer on larger-screen behaviour
(`class="flex-col md:flex-row"`).

## 8. How the tests work

`App.test.tsx` — render a component into the fake DOM and assert on what a *user* perceives:

```tsx
render(
  <MemoryRouter initialEntries={['/app']}>
    <App />
  </MemoryRouter>,
)
expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
```

- `MemoryRouter` replaces `BrowserRouter` in tests — a router with a pretend URL history
  (jsdom has no real address bar). Same idea as MockMvc standing in for a real server.
- `getByRole('heading', ...)` — Testing Library's philosophy: query by *accessibility role*,
  not CSS selectors or ids, so tests assert what users experience and survive refactors.

`client.test.ts` — pure unit tests: `vi.stubGlobal('fetch', vi.fn()...)` replaces the global
`fetch` with a mock (≈ Mockito `when(...).thenReturn(...)`), then asserts the envelope
unwrap, the error mapping, and the 401 handler firing. `vi.fn()` is a spy; `mockResolvedValue`
is `thenReturn` for promises.

## 9. Vocabulary cheat-sheet (Java → web)

| Java/Spring world | This world |
|---|---|
| Maven / `pom.xml` | npm / `package.json` (+ lockfile) |
| `target/` | `dist/` |
| `~/.m2` | `node_modules/` (per-project) |
| `javac` (with erasure) | `tsc` (erases *all* types) |
| Checkstyle | ESLint (+ Prettier for formatting) |
| JUnit + Mockito | Vitest (`vi.fn`, `mockResolvedValue`) |
| MockMvc | Testing Library render + queries |
| Sealed interface + exhaustive switch | Discriminated union + narrowing |
| DI container / `@Bean` scope | Provider components wrapping the tree |
| DTO record | `interface` / `type` (compile-time only) |
| `Optional.empty()` dance | `null`/`undefined` under `strict` — compiler forces the check |
