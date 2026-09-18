import Money from '@/components/Money'
import type { TransactionResponse } from '@/api/types'

/** Shared row list — used by the transactions page and the overview's recent slice. */
export default function TransactionList({ transactions }: { transactions: TransactionResponse[] }) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-sm">No transactions yet.</p>
  }
  return (
    <ul className="divide-border divide-y">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {tx.merchantName ?? tx.description ?? 'Transaction'}
            </p>
            <p className="text-muted-foreground text-xs">
              {tx.occurredAt && new Date(tx.occurredAt).toLocaleDateString()}
              {tx.status === 'PENDING' && ' · pending'}
            </p>
          </div>
          {tx.amountMinorUnits != null && tx.currency && (
            <Money
              minorUnits={tx.amountMinorUnits}
              currency={tx.currency}
              className="shrink-0 text-sm font-medium"
            />
          )}
        </li>
      ))}
    </ul>
  )
}
