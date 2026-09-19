import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Money from '@/components/Money'
import { accountLabel } from '@/features/accounts/accountLabel'
import TransactionList from '@/features/transactions/TransactionList'
import type { AccountResponse, TransactionResponse } from '@/api/types'

/**
 * Dashboard v1 blocks (dec 27) — each self-contained and "widget-shaped" so the
 * future pick-and-choose dashboard can adopt them unchanged.
 */

export function BalanceBlock({ accounts }: { accounts: AccountResponse[] }) {
  const total = accounts.reduce((sum, a) => sum + (a.balanceMinorUnits ?? 0), 0)
  const currency = accounts[0]?.currency ?? 'GBP'
  const newestAsOf = accounts
    .map((a) => a.balanceAsOf)
    .filter((x): x is string => !!x)
    .sort()
    .at(-1)

  return (
    <Card>
      <CardHeader>
        <CardDescription>Balance</CardDescription>
        <CardTitle>
          <Money minorUnits={total} currency={currency} className="text-3xl font-semibold" />
        </CardTitle>
        {newestAsOf && (
          <CardDescription className="text-xs">
            as of {new Date(newestAsOf).toLocaleString()}
          </CardDescription>
        )}
      </CardHeader>
      {accounts.length > 1 && (
        <CardContent className="space-y-1.5">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{accountLabel(account)}</span>
              {account.balanceMinorUnits != null && account.currency && (
                <Money minorUnits={account.balanceMinorUnits} currency={account.currency} />
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

export function SpendBlock({
  label,
  outMinorUnits,
  currency,
  hint,
}: {
  label: string
  outMinorUnits: number | undefined
  currency: string
  hint?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>
          {outMinorUnits != null ? (
            <Money
              minorUnits={outMinorUnits}
              currency={currency}
              className="text-2xl font-semibold"
            />
          ) : (
            <span className="text-muted-foreground text-2xl">—</span>
          )}
        </CardTitle>
        {hint && <CardDescription className="text-xs">{hint}</CardDescription>}
      </CardHeader>
    </Card>
  )
}

export function RecentTransactionsBlock({ transactions }: { transactions: TransactionResponse[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>Recent transactions</CardDescription>
        <Link
          to="/app/transactions"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <TransactionList transactions={transactions} />
      </CardContent>
    </Card>
  )
}
