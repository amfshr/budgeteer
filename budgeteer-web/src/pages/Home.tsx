import { Link, useSearchParams } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAccounts } from '@/features/accounts/useAccounts'
import AccountsSection from '@/features/accounts/AccountsSection'
import ConnectMonzoCard from '@/features/monzo/ConnectMonzoCard'
import { useSyncProgress } from '@/features/monzo/useSyncProgress'
import TransactionList from '@/features/transactions/TransactionList'
import { useTransactions } from '@/features/transactions/useTransactions'

/** Overview v0 — deliberately plain composition; Session 02 owns the real dashboard. */
export default function Home() {
  const [params] = useSearchParams()
  const accounts = useAccounts()
  const { syncing, transactionCount } = useSyncProgress()
  const recent = useTransactions(0, 8)

  const hasAccounts = (accounts.data?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>

      {params.get('monzo') === 'connected' && (
        <Alert>
          <AlertTitle>Monzo connected</AlertTitle>
          <AlertDescription>
            Your transaction history is importing — it appears below as it lands.
          </AlertDescription>
        </Alert>
      )}
      {params.get('monzo') === 'denied' && (
        <Alert variant="destructive">
          <AlertTitle>Connection cancelled</AlertTitle>
          <AlertDescription>
            Monzo access wasn&apos;t granted. You can try connecting again whenever you like.
          </AlertDescription>
        </Alert>
      )}

      {syncing && (
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          <div
            role="status"
            aria-label="Syncing"
            className="border-muted-foreground size-4 animate-spin rounded-full border-2 border-t-transparent"
          />
          Importing transactions… {transactionCount.toLocaleString()} so far
        </div>
      )}

      {accounts.isPending ? (
        <p className="text-muted-foreground text-sm">Loading accounts…</p>
      ) : hasAccounts ? (
        <>
          <AccountsSection accounts={accounts.data ?? []} />
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Recent transactions</h3>
              <Link
                to="/app/transactions"
                className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <TransactionList transactions={recent.data?.items ?? []} />
          </section>
        </>
      ) : syncing || params.get('monzo') === 'connected' ? null : (
        <ConnectMonzoCard />
      )}
    </div>
  )
}
