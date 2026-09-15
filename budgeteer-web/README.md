# budgeteer-web

The Budgeteer frontend — a mobile-first TypeScript React app (Vite, Tailwind v4 +
shadcn/ui, TanStack Query, React Router). Platform decisions: Design Session 01
(`.agents/notes/product/design-session-01-top-down.md`), component stack amended to
Tailwind/shadcn 2026-09-13.

## Commands

```bash
npm install        # once
npm run dev        # dev server on :5173, /api proxied to Spring on :8080
npm test           # Vitest run (test:watch for watch mode)
npm run lint       # ESLint
npm run format     # Prettier write (format:check in CI)
npm run build      # type-check + production bundle to dist/
```

## Talking to the backend

The Vite dev server proxies `/api/**` to `http://localhost:8080` (see `vite.config.ts`), so
the app is always same-origin with the API — session cookies work with zero CORS/SameSite
configuration. Start the backend (IDE run or `./scripts/dev.sh`), then `npm run dev`.

All requests go through `src/api/client.ts`, which speaks the house `ApiResponse`/`ApiError`
envelope, throws `ApiClientError` (carrying the server's error `code`) on failure, and invokes
a registerable handler on 401 (`MISSING_TOKEN`) responses — wire that to the login redirect
when real auth lands.
