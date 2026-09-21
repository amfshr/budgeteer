import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import Money from '@/components/Money'
import { formatMoneyParts } from '@/lib/money'
import { asOfLabel } from '@/lib/dates'
import { accountLabel } from '@/features/accounts/accountLabel'
import TransactionList from '@/features/transactions/TransactionList'
import type { AccountResponse, TransactionResponse } from '@/api/types'

/**
 * Dashboard v1 blocks, restyled per the design pass (canvas option 1a, palette 3e).
 * Each block stays self-contained and widget-shaped.
 */

export function BalanceBlock({ accounts }: { accounts: AccountResponse[] }) {
  const total = accounts.reduce((sum, a) => sum + (a.balanceMinorUnits ?? 0), 0)
  const currency = accounts[0]?.currency ?? 'GBP'
  const { major, minor } = formatMoneyParts(total, currency)
  const newestAsOf = accounts
    .map((a) => a.balanceAsOf)
    .filter((x): x is string => !!x)
    .sort()
    .at(-1)

  return (
    <Card>
      <CardHeader>
        <CardDescription>Total balance</CardDescription>
        <div className="text-4xl font-semibold tracking-tight tabular-nums">
          {major}
          <span className="text-muted-foreground font-medium">{minor}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => (
            <span
              key={account.id}
              className="bg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm"
            >
              <span className="text-muted-foreground">{accountLabel(account)}</span>
              {account.balanceMinorUnits != null && account.currency && (
                <Money
                  minorUnits={account.balanceMinorUnits}
                  currency={account.currency}
                  className="font-medium"
                />
              )}
            </span>
          ))}
        </div>
        {newestAsOf && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span aria-hidden className="bg-money-positive size-1.5 rounded-full" />
            {asOfLabel(newestAsOf)} · synced hourly
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function SpendBlock({
  label,
  rangeLabel,
  outMinorUnits,
  inMinorUnits,
  currency,
}: {
  label: string
  rangeLabel: string
  outMinorUnits: number | undefined
  inMinorUnits: number | undefined
  currency: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <CardDescription>{label}</CardDescription>
          <span className="text-muted-foreground text-xs">{rangeLabel}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          {outMinorUnits != null ? (
            <Money minorUnits={outMinorUnits} currency={currency} />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        <CardDescription className="text-xs">out</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-t pt-2.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">in</span>
            {inMinorUnits != null && inMinorUnits > 0 ? (
              <Money
                minorUnits={inMinorUnits}
                currency={currency}
                signed
                className="text-money-positive font-medium"
              />
            ) : (
              <Money minorUnits={inMinorUnits ?? 0} currency={currency} className="font-medium" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecentTransactionsBlock({ transactions }: { transactions: TransactionResponse[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <span className="text-[15px] font-semibold tracking-tight">Recent</span>
        <Link
          to="/app/transactions"
          className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
        >
          See all →
        </Link>
      </CardHeader>
      <CardContent>
        <TransactionList transactions={transactions} />
      </CardContent>
    </Card>
  )
}
