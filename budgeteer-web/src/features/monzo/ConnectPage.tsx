import { Link, useSearchParams } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccounts } from '@/features/accounts/useAccounts'
import { useTransactions } from '@/features/transactions/useTransactions'
import { useSyncProgress } from './useSyncProgress'

function Spinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="border-muted-foreground size-5 animate-spin rounded-full border-2 border-t-transparent"
    />
  )
}

/**
 * The four-phase connect onboarding (dec 28). The OAuth callback redirects here
 * (?monzo=connected|denied); phases are derived from live state, not stored:
 *   explain  — no monzo param, nothing syncing: CTA into the OAuth redirect
 *   approve  — connected, but the backfill hasn't started (Monzo SCA push wait)
 *   import   — backfill running: live transaction count
 *   done     — connected and data present: green tick, go to overview
 */
export default function ConnectPage() {
  const [params] = useSearchParams()
  const monzo = params.get('monzo')
  const { syncing, transactionCount } = useSyncProgress()
  const accounts = useAccounts()
  const transactions = useTransactions(0, 1)

  const hasData = (accounts.data?.length ?? 0) > 0 && (transactions.data?.totalElements ?? 0) > 0

  const phase =
    monzo === 'error'
      ? 'error'
      : monzo === 'denied'
        ? 'denied'
        : syncing
          ? 'import'
          : monzo === 'connected'
            ? hasData
              ? 'done'
              : 'approve'
            : hasData
              ? 'done'
              : 'explain'

  return (
    <div className="mx-auto max-w-md space-y-4 pt-4">
      {phase === 'error' && (
        <>
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              The connection didn&apos;t complete — the link may have been reused or expired. Trying
              again starts a fresh, clean attempt.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <a href="/api/v1/monzo/connect">Try again</a>
          </Button>
        </>
      )}

      {phase === 'denied' && (
        <>
          <Alert variant="destructive">
            <AlertTitle>Connection cancelled</AlertTitle>
            <AlertDescription>
              Monzo access wasn&apos;t granted — nothing was connected. You can try again whenever
              you like.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <a href="/api/v1/monzo/connect">Try again</a>
          </Button>
        </>
      )}

      {phase === 'explain' && (
        <Card>
          <CardHeader>
            <CardTitle>Connect your Monzo account</CardTitle>
            <CardDescription>
              You&apos;ll be sent to Monzo to approve access. Keep your phone nearby — Monzo
              confirms with a push notification, and approving it quickly lets your full transaction
              history import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/api/v1/monzo/connect">Connect Monzo</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === 'approve' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Spinner label="Waiting for approval" /> Almost there
            </CardTitle>
            <CardDescription>
              Open the Monzo app on your phone and <strong>approve the notification</strong> — your
              import starts the moment you do.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {phase === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Spinner label="Importing" /> Importing your transactions
            </CardTitle>
            <CardDescription>
              {transactionCount.toLocaleString()} imported so far. This usually takes under a minute
              — your accounts appear automatically when it finishes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {phase === 'done' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-money-positive flex items-center gap-2">
              <span aria-hidden>✓</span> Monzo sync complete
            </CardTitle>
            <CardDescription>
              Your accounts and transaction history are in. Balances refresh automatically every
              hour.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/app">Go to your overview</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
