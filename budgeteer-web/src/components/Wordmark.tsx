import { cn } from '@/lib/utils'

/**
 * The brand signature (design pass, option 1a): lowercase wordmark with a small
 * emerald square — the one place the accent is decorative, everywhere else it
 * means money-positive/on-track (decision 33, ink-first).
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-baseline gap-0.5 font-semibold tracking-tight', className)}
    >
      budgeteer
      <span aria-hidden className="bg-money-positive inline-block size-1.5 rounded-[2px]" />
    </span>
  )
}
