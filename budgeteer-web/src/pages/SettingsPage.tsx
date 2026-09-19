import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogout, useSession } from '@/features/auth/useSession'

/** Placeholder destination (dec 26) — #15 data rights fills this page. */
export default function SettingsPage() {
  const { user } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
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
            Manage Monzo connections, export your data, and delete your account — coming with the
            data-rights milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
