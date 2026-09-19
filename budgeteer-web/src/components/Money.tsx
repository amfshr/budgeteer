import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/money'

interface MoneyProps {
  minorUnits: number
  currency: string
  /** Prefix positive amounts with an explicit + (income rows). */
  signed?: boolean
  className?: string
}

export default function Money({ minorUnits, currency, signed = false, className }: MoneyProps) {
  const prefix = signed && minorUnits > 0 ? '+' : ''
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formatMoney(minorUnits, currency)}
    </span>
  )
}
