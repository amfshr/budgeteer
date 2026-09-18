import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/money'

interface MoneyProps {
  minorUnits: number
  currency: string
  className?: string
}

export default function Money({ minorUnits, currency, className }: MoneyProps) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(minorUnits, currency)}</span>
}
