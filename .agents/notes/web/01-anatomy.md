# Web 01 — Anatomy of `budgeteer-web`

> Companion docs: [02 — React & TypeScript primer](02-react-ts-primer.md) ·
> [03 — The shape we'll grow into](03-frontend-shape.md)
>
> Everything in this doc describes the code that's actually sitting in `budgeteer-web/`
> right now. Read it with the folder open.

## 1. The three technologies, in one paragraph each

**TypeScript** is JavaScript plus a type system that exists *only at compile time*. `tsc`
(the compiler) checks the types and then throws them away — the browser runs plain
JavaScript, and there is no runtime type enforcement at all. Mental model: like Java's
generics erasure, but for *every* type in the language. A `string` annotation stops wrong
code compiling; it cannot stop a wrong value arriving over the network at runtime (that's
why the API client treats the server envelope carefully).

**React** is a UI library with one idea: your UI is a pure function of state. You write
*components* — plain functions that take inputs (props) and return a description of markup
(JSX) — and React re-runs them when state changes and patches the real browser DOM to match.
You never write `document.getElementById(...).innerHTML = ...`; you change state, React
redraws.

**Vite** is the build tool — the Maven of this world. In dev it runs a server with instant
hot-reload (it serves your source files individually as native ES modules — no bundling
step, which is why it starts in milliseconds). For production, `vite build` bundles
everything into a handful of static, minified, cache-stamped files in `dist/`.

## 2. The pipeline (what happens when)

```
                 dev:   src/*.tsx ──(served individually, transformed on demand)──▶ browser :5173
                                          ▲ hot-module-reload on every save
                                          └ /api/** proxied to Spring on :8080

               build:   tsc -b (type-check ONLY, emits nothing)
                        vite build (bundle+minify)  ──▶  dist/index.html
                                                         dist/assets/index-<hash>.js
                                                         dist/assets/index-<hash>.css

                test:   vitest (runs *.test.ts(x) in a fake browser DOM — jsdom)
```

Key point: **type-checking and bundling are separate steps.** Vite itself strips types
without checking them (fast dev loop); `npm run build` runs `tsc -b` first so CI fails on
type errors. That's why the build script is `tsc -b && vite build`.

## 3. Source vs artifact — what gets committed

| Path | What it is | Committed? |
|------|-----------|------------|
| `src/`, `index.html`, `public/` | Source | ✅ |
| `package.json` | Manifest: deps + scripts (≈ `pom.xml`) | ✅ |
| `package-lock.json` | Exact resolved version of every transitive dep (≈ a frozen dependency tree). Machines regenerate `node_modules` from this — `npm ci` in CI installs *exactly* this | ✅ never hand-edit |
| All config (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`) | Source | ✅ |
| `node_modules/` | Installed dependencies (≈ `~/.m2`, but per-project) | ❌ gitignored |
| `dist/` | Build output (≈ `target/`) | ❌ gitignored |
| `coverage/` | Test coverage output | ❌ gitignored |

The rule is the same as the Java side: **anything a machine can regenerate from source is an
artifact and stays out of git.** If you ever see `dist/` in a diff, something's wrong.

## 4. File-by-file tour

### `index.html` — the actual entry point
Unlike a Spring app (which starts at `main()`), a Vite app starts at an HTML file. It's
nearly empty: a `<div id="root">` for React to take over, and one line that matters —

```html
<script type="module" src="/src/main.tsx"></script>
```

Vite intercepts that import, compiles `main.tsx` on the fly, and the whole app unfolds from
there. In the production build, Vite rewrites this to point at the hashed bundle instead.
The `viewport` meta tag is what makes mobile rendering behave — part of the mobile-first
story.

### `package.json` — the pom
Three sections you care about:
- **`scripts`** — named commands, run with `npm run <name>` (≈ Maven goals). Ours:
  `dev`, `build`, `preview`, `lint`, `format`/`format:check`, `test`/`test:watch`, `coverage`.
- **`dependencies`** — shipped to the browser: `react`, `react-dom`, `react-router`,
  `@tanstack/react-query`, `bootstrap` + `react-bootstrap`.
- **`devDependencies`** — build/test tooling only, never in the bundle: `vite`,
  `typescript`, `vitest`, testing-library, `eslint`, `prettier`, type packages (`@types/*`).

The `^` in versions (`"react": "^19.2.8"`) means "any 19.x ≥ 19.2.8" — but the lockfile pins
the exact one actually installed, so builds are reproducible anyway.

### `vite.config.ts` — dev server + build + test config
Small but load-bearing:
- `plugins: [react()]` — teaches Vite to compile JSX and enables fast-refresh.
- `server.proxy: { '/api': 'http://localhost:8080' }` — **the reason auth Just Works in
  dev.** The browser only ever talks to `:5173`; Vite forwards `/api/**` to Spring. Because
  everything is one origin, the HttpOnly session cookies flow with zero CORS or SameSite
  configuration. (Prod gets the same effect a different way in #17: one domain, edge routes
  `/api` to the backend.)
- `test: {...}` — Vitest settings: run tests in `jsdom` (a simulated browser DOM inside
  Node), load `src/test/setup.ts` first (registers the jest-dom matchers like
  `toBeInTheDocument()`).

### The three `tsconfig*.json` — why THREE?
Because two different "worlds" of code get type-checked with different rules:
- `tsconfig.app.json` → `src/` — browser code (`lib` includes `DOM`, JSX enabled).
- `tsconfig.node.json` → `vite.config.ts` — a file that runs in *Node*, not the browser
  (no DOM, has `node` types).
- `tsconfig.json` — just a solution file gluing the two together (`references`), so
  `tsc -b` ("build the whole solution") checks both. ≈ a Maven aggregator pom.

Notable options (both files): `"strict": true` — the full strictness suite; non-negotiable,
it's what makes TS worth having (we added it; the current upstream template oddly omits it).
`"noEmit": true` — tsc never generates JS here; it's purely a checker, Vite does the emitting.
`"verbatimModuleSyntax"` — forces `import type` for type-only imports so erasure is unambiguous.

### `eslint.config.js` + `.prettierrc.json` — checkstyle and formatter
- **ESLint** finds *problems* (unused vars, broken hook usage). Flat-config format: an array
  of config objects; ours layers JS recommended → TypeScript recommended → React hooks rules
  → react-refresh rules → `prettier` last (which *disables* every stylistic ESLint rule so
  the two tools never fight).
- **Prettier** owns *style* (quotes, semicolons, wrapping) and simply rewrites files.
  You never argue with it, that's the point. `npm run format` before committing;
  CI runs `format:check`.

### `public/`
Files copied into `dist/` verbatim, no processing — favicons, robots.txt eventually.
Currently empty. Don't put code here.

### `src/` — the app itself
```
src/
├── main.tsx          # bootstrap: mounts <App> into #root, wires the providers
├── App.tsx           # shell: navbar + route table
├── App.test.tsx      # smoke tests for the shell
├── pages/            # one component per routed screen
│   ├── Landing.tsx   #   "/"      public landing
│   └── Home.tsx      #   "/app"   authenticated home (placeholder)
├── api/
│   ├── client.ts     # THE way to talk to the backend (envelope + 401 contract)
│   └── client.test.ts
└── test/
    └── setup.ts      # test bootstrap (jest-dom matchers)
```
The source files are walked line-by-line in [02 — React & TypeScript primer](02-react-ts-primer.md).

## 5. The commands you'll actually type

```bash
npm install         # once per clone / after deps change (reads the lockfile)
npm run dev         # localhost:5173 — leave it running, saves hot-reload instantly
npm test            # one test run;  npm run test:watch re-runs on save
npm run lint        # complaints but no changes
npm run format      # rewrites files to house style
npm run build       # what CI does: type-check + production bundle
npm run preview     # serve the dist/ bundle locally (rarely needed)
```

Dev loop: backend running (IDE debug or `./scripts/dev.sh`) + `npm run dev` + browser on
:5173. That's it.

## 6. Official docs worth actually reading

- React: https://react.dev/learn — the modern tutorial; excellent, read it in order
- TypeScript for Java/C# programmers: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html
- Vite guide: https://vite.dev/guide/
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- React Router: https://reactrouter.com/
- Testing Library: https://testing-library.com/docs/queries/about (the query-priority page
  explains the `getByRole` style our tests use)
- react-bootstrap: https://react-bootstrap.github.io/
