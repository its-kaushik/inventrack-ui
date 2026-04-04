import { cn } from '@/lib/utils'
import { formatIndianCurrency } from '@/lib/format-currency'

interface LedgerRowProps {
  date: string
  description: string
  debit?: number
  credit?: number
  balance: number
  className?: string
}

export function LedgerRow({
  date,
  description,
  debit,
  credit,
  balance,
  className,
}: LedgerRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 border-b px-3 py-2 text-sm last:border-b-0',
        className
      )}
    >
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {date}
      </span>

      <span className="truncate">{description}</span>

      <span
        className={cn(
          'font-mono tabular-nums text-right',
          debit ? 'text-red-600 dark:text-red-400' : 'text-transparent select-none'
        )}
      >
        {debit ? formatIndianCurrency(debit) : '-'}
      </span>

      <span
        className={cn(
          'font-mono tabular-nums text-right',
          credit
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-transparent select-none'
        )}
      >
        {credit ? formatIndianCurrency(credit) : '-'}
      </span>

      <span className="font-mono tabular-nums text-right font-medium">
        {formatIndianCurrency(balance)}
      </span>
    </div>
  )
}
