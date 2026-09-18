import { useState } from 'react'
import { Button } from '@/components/ui/button'
import TransactionList from './TransactionList'
import { useTransactions } from './useTransactions'

export default function TransactionsPage() {
  const [page, setPage] = useState(0)
  const { data, isPending, isError } = useTransactions(page)

  const totalPages = data?.totalPages ?? 0
  const hasPrev = page > 0
  const hasNext = page + 1 < totalPages

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        {data?.totalElements != null && (
          <p className="text-muted-foreground text-sm">{data.totalElements} total</p>
        )}
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading…</p>}
      {isError && <p className="text-destructive text-sm">Couldn&apos;t load transactions.</p>}
      {data && <TransactionList transactions={data.items ?? []} />}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  )
}
