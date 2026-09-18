import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLogout, useSession } from '@/features/auth/useSession'

/**
 * DELIBERATELY minimal authenticated chrome: brand + two links + logout.
 * The real navigation/chrome is Design Session 02's output (notes/web/03 §1a) —
 * nothing here should grow before that session happens.
 */
export default function AppLayout() {
  const { user } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm underline-offset-4 hover:underline',
      isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/app" className="text-lg font-semibold tracking-tight">
              Budgeteer
            </Link>
            <nav className="flex items-center gap-4">
              <NavLink to="/app" end className={navLink}>
                Overview
              </NavLink>
              <NavLink to="/app/transactions" className={navLink}>
                Transactions
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) })
              }
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
