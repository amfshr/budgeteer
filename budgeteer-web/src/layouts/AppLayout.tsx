import { Link, NavLink, Outlet } from 'react-router'
import { House, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSyncProgress } from '@/features/monzo/useSyncProgress'

const destinations = [
  { to: '/app', label: 'Overview', icon: House, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: List, end: false },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
]

/**
 * Authenticated chrome (dec 26): bottom tab bar on mobile, slim top nav ≥sm.
 * Both render the same destination set; only one is visible per breakpoint.
 * Visual identity refines after the design pass — structure is decided.
 */
export default function AppLayout() {
  // Mounted here (not per-page) so an in-flight import keeps invalidating the
  // accounts/transactions caches whichever tab the user is on.
  useSyncProgress()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/app" className="text-lg font-semibold tracking-tight">
            budgeteer
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            {destinations.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'text-sm underline-offset-4 hover:underline',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar — thumb-reachable, the glance is Tab 1 */}
      <nav
        aria-label="Primary"
        className="bg-background/95 fixed inset-x-0 bottom-0 border-t backdrop-blur sm:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {destinations.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
