import { Badge } from '@/components/ui/badge'
import Money from '@/components/Money'
import { groupByDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { TransactionResponse } from '@/api/types'

/**
 * Shared row list with day group headers (dec 31). Income renders in the
 * money-positive token with an explicit +; spend stays default foreground.
 */
export default function TransactionList({ transactions }: { transactions: TransactionResponse[] }) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-sm">No transactions yet.</p>
  }

  const groups = groupByDay(transactions, (tx) => tx.occurredAt)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.label}>
          <h4 className="text-muted-foreground pb-1 text-xs font-medium tracking-wide uppercase">
            {group.label}
          </h4>
          <ul className="divide-border divide-y">
            {group.items.map((tx) => {
              const income = (tx.amountMinorUnits ?? 0) > 0
              return (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {tx.merchantName ?? tx.description ?? 'Transaction'}
                    </p>
                    {tx.status === 'PENDING' && (
                      <Badge variant="secondary" className="shrink-0">
                        pending
                      </Badge>
                    )}
                  </div>
                  {tx.amountMinorUnits != null && tx.currency && (
                    <Money
                      minorUnits={tx.amountMinorUnits}
                      currency={tx.currency}
                      signed={income}
                      className={cn(
                        'shrink-0 text-sm font-medium',
                        income && 'text-money-positive',
                      )}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
