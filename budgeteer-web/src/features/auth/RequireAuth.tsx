import { Navigate, Outlet } from 'react-router'
import { useSession } from './useSession'

/** Layout-route guard for everything under /app. */
export default function RequireAuth() {
  const { user, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div
          role="status"
          aria-label="Loading"
          className="border-muted-foreground size-6 animate-spin rounded-full border-2 border-t-transparent"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
