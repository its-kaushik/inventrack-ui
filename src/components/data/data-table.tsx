import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsDesktop } from '@/hooks/use-media-query'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { EmptyState } from './empty-state'
import { TableSkeleton } from './loading-skeleton'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  hideOnMobile?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  mobileCard?: (item: T) => React.ReactNode
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = 'No data found',
  mobileCard,
}: DataTableProps<T>) {
  const isDesktop = useIsDesktop()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} />
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />
  }

  // Mobile card list
  if (!isDesktop && mobileCard) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => onRowClick?.(item)}
            className={cn(onRowClick && 'cursor-pointer')}
          >
            {mobileCard(item)}
          </div>
        ))}
      </div>
    )
  }

  // Desktop table
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50">
          <TableRow>
            {columns
              .filter((col) => (isDesktop ? true : !col.hideOnMobile))
              .map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && 'cursor-pointer select-none',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                        )}
                      </span>
                    )}
                  </span>
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick?.(item)}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {columns
                .filter((col) => (isDesktop ? true : !col.hideOnMobile))
                .map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(item)}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
