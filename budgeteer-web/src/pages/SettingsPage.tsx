import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogout, useSession } from '@/features/auth/useSession'
import { useConnections, useDisconnect, useSyncNow } from '@/features/monzo/useConnections'
import type { MonzoConnectionResponse } from '@/api/types'

function connectedLabel(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ConnectionRow({ connection }: { connection: MonzoConnectionResponse }) {
  const disconnect = useDisconnect()
  const syncNow = useSyncNow()
  const healthy = connection.isActive && !connection.isTokenExpired

  return (
    <li className="flex items-center gap-3 border-b py-3 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          Monzo
          <span
            className={
              healthy
                ? 'bg-money-positive-subtle text-money-positive rounded-full px-1.5 py-px text-[10px] font-medium'
                : 'text-muted-foreground rounded-full border px-1.5 py-px text-[10px] font-medium'
            }
          >
            {healthy ? 'Active' : 'Needs re-auth'}
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          Connected {connectedLabel(connection.connectedAt)}
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={syncNow.isPending || !healthy}
        onClick={() => syncNow.mutate()}
      >
        {syncNow.isPending ? 'Syncing…' : 'Sync now'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disconnect.isPending}
        onClick={() => {
          if (
            connection.id &&
            window.confirm(
              'Unlink Monzo? Budgeteer stops syncing. Your imported data stays until you delete it.',
            )
          ) {
            disconnect.mutate(connection.id)
          }
        }}
      >
        {disconnect.isPending ? 'Unlinking…' : 'Unlink'}
      </Button>
    </li>
  )
}

/** Settings v1 — connected banks now; export/delete arrive with #15 data rights. */
export default function SettingsPage() {
  const { user } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const connections = useConnections()

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Connected banks</CardTitle>
          <CardDescription>Where your balances and transactions come from.</CardDescription>
        </CardHeader>
        <CardContent>
          {connections.isPending ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (connections.data?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">
              No banks connected yet —{' '}
              <Link
                to="/app/connect"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                connect Monzo
              </Link>
              .
            </p>
          ) : (
            <ul>
              {connections.data?.map((connection) => (
                <ConnectionRow key={connection.id} connection={connection} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) })
            }
          >
            Log out
          </Button>
          <p className="text-muted-foreground text-sm">
            Export your data and delete your account — coming with the data-rights milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
