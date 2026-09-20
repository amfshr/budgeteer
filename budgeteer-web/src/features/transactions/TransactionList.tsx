import Money from '@/components/Money'
import { groupByDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { TransactionResponse } from '@/api/types'

function initialOf(tx: TransactionResponse): string {
  const name = tx.merchantName ?? tx.description ?? '?'
  return name.trim().charAt(0).toUpperCase() || '?'
}

function timeOf(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Shared row list, design-pass treatment (option 1a): day group headers,
 * merchant-initial avatars, time sub-line, income in money-positive with
 * explicit +, pending as a quiet outline pill under the amount.
 */
export default function TransactionList({ transactions }: { transactions: TransactionResponse[] }) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-sm">No transactions yet.</p>
  }

  const groups = groupByDay(transactions, (tx) => tx.occurredAt)

  return (
    <div>
      {groups.map((group) => (
        <section key={group.label}>
          <h4 className="text-muted-foreground pt-3 pb-0.5 text-xs font-medium">{group.label}</h4>
          <ul>
            {group.items.map((tx) => {
              const income = (tx.amountMinorUnits ?? 0) > 0
              return (
                <li key={tx.id} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                  <span
                    aria-hidden
                    className="bg-muted text-muted-foreground grid size-9 flex-none place-items-center rounded-full text-[13px] font-semibold"
                  >
                    {initialOf(tx)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {tx.merchantName ?? tx.description ?? 'Transaction'}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {timeOf(tx.occurredAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    {tx.amountMinorUnits != null && tx.currency && (
                      <Money
                        minorUnits={tx.amountMinorUnits}
                        currency={tx.currency}
                        signed={income}
                        className={cn('block text-sm font-medium', income && 'text-money-positive')}
                      />
                    )}
                    {tx.status === 'PENDING' && (
                      <span className="text-muted-foreground mt-0.5 inline-block rounded-full border px-1.5 py-px text-[10px] font-medium">
                        Pending
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
