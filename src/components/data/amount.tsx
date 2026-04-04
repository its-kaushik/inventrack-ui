import { cn } from '@/lib/utils'
import { formatIndianCurrency, formatCompact } from '@/lib/format-currency'

interface AmountProps {
  value: number
  compact?: boolean
  className?: string
}

export function Amount({ value, compact, className }: AmountProps) {
  const formatted = compact ? formatCompact(value) : formatIndianCurrency(value)
  const isNegative = value < 0

  return (
    <span
      className={cn(
        'font-mono tabular-nums text-right',
        isNegative && 'text-destructive',
        className
      )}
    >
      {formatted}
    </span>
  )
}
