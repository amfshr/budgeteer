import { Link, Outlet } from 'react-router'

/** Minimal chrome for unauthenticated pages: brand bar + centered content. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Budgeteer
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Outlet />
      </main>
    </div>
  )
}
