import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccounts } from '@/features/accounts/useAccounts'
import {
  BalanceBlock,
  RecentTransactionsBlock,
  SpendBlock,
} from '@/features/dashboard/DashboardBlocks'
import { useSpendSummary } from '@/features/dashboard/useSpendSummary'
import { useTransactions } from '@/features/transactions/useTransactions'

/** Overview = dashboard v1: the fixed four-block stack (dec 27). Connect states live on /app/connect. */
export default function Home() {
  const accounts = useAccounts()
  const summary = useSpendSummary(accounts.data)
  const recent = useTransactions(0, 8)

  const hasAccounts = (accounts.data?.length ?? 0) > 0
  const currency = accounts.data?.[0]?.currency ?? 'GBP'

  if (accounts.isPending) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  if (!hasAccounts) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No accounts yet</CardTitle>
          <CardDescription>
            Connect your Monzo account and your balances and transaction history import
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/app/connect">Connect Monzo</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="sr-only">Overview</h2>
      <BalanceBlock accounts={accounts.data ?? []} />
      <div className="grid grid-cols-2 gap-4">
        <SpendBlock
          label="This month"
          outMinorUnits={summary.data?.monthOut}
          currency={currency}
          hint="spent month to date"
        />
        <SpendBlock
          label="This week"
          outMinorUnits={summary.data?.weekOut}
          currency={currency}
          hint="spent this week"
        />
      </div>
      <RecentTransactionsBlock transactions={recent.data?.items ?? []} />
    </div>
  )
}
