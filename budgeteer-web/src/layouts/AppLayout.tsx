import { Link, Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLogout, useSession } from '@/features/auth/useSession'

/**
 * DELIBERATELY minimal authenticated chrome: brand + who's signed in + logout.
 * The real navigation/chrome is Design Session 02's output (notes/web/03 §1a) —
 * nothing here should grow before that session happens.
 */
export default function AppLayout() {
  const { user } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/app" className="text-lg font-semibold tracking-tight">
            Budgeteer
          </Link>
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
