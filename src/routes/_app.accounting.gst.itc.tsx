import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfDay } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getItcRegister } from '@/api/gst.api'
import type { ItcFilters } from '@/api/gst.api'
import { listSuppliers } from '@/api/suppliers.api'
import type { ItcEntry } from '@/types/models'
import { useTenant } from '@/hooks/use-tenant'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { DateRangePicker } from '@/components/form/date-range-picker'
import type { DateRange } from '@/components/form/date-range-picker'
import { formatDate } from '@/lib/format-date'
import { formatIndianCurrency } from '@/lib/format-currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/accounting/gst/itc')({
  component: ItcRegisterPage,
})

const PAGE_SIZE = 25

function ItcRegisterPage() {
  const { gstScheme } = useTenant()
  const navigate = useNavigate()

  // Redirect composition scheme users
  useEffect(() => {
    if (gstScheme === 'composition') {
      navigate({ to: '/accounting/gst' })
    }
  }, [gstScheme, navigate])

  const [supplierId, setSupplierId] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  const [offset, setOffset] = useState(0)

  const { data: suppliers = [] } = useQuery({
    queryKey: queryKeys.suppliers.list({ search: '' }),
    queryFn: () => listSuppliers().then((res) => res.data),
  })

  const filters: ItcFilters = useMemo(
    () => ({
      supplier_id: supplierId || undefined,
      date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [supplierId, dateRange, offset],
  )

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.gst.itc(filters as Record<string, unknown>),
    queryFn: () => getItcRegister(filters).then((res) => res.data),
  })

  const items = (data?.items ?? []) as ItcEntry[]
  const hasMore = data?.hasMore ?? false

  // Compute summary totals
  const summary = useMemo(() => {
    let cgst = 0
    let sgst = 0
    let igst = 0
    for (const entry of items) {
      cgst += Number(entry.cgst)
      sgst += Number(entry.sgst)
      igst += Number(entry.igst)
    }
    return { cgst, sgst, igst }
  }, [items])

  const columns: Column<ItcEntry>[] = useMemo(
    () => [
      {
        key: 'supplierName',
        header: 'Supplier',
        render: (row) => <span className="text-sm font-medium">{row.supplierName}</span>,
      },
      {
        key: 'invoiceNumber',
        header: 'Invoice #',
        hideOnMobile: true,
        render: (row) => (
          <span className="font-mono text-xs">{row.invoiceNumber ?? '-'}</span>
        ),
      },
      {
        key: 'invoiceDate',
        header: 'Invoice Date',
        hideOnMobile: true,
        render: (row) => (
          <span className="text-sm">{row.invoiceDate ? formatDate(row.invoiceDate) : '-'}</span>
        ),
      },
      {
        key: 'taxableAmount',
        header: 'Taxable Amt',
        className: 'text-right',
        render: (row) => <Amount value={Number(row.taxableAmount)} />,
      },
      {
        key: 'cgst',
        header: 'CGST',
        className: 'text-right',
        hideOnMobile: true,
        render: (row) => <Amount value={Number(row.cgst)} />,
      },
      {
        key: 'sgst',
        header: 'SGST',
        className: 'text-right',
        hideOnMobile: true,
        render: (row) => <Amount value={Number(row.sgst)} />,
      },
      {
        key: 'igst',
        header: 'IGST',
        className: 'text-right',
        hideOnMobile: true,
        render: (row) => <Amount value={Number(row.igst)} />,
      },
      {
        key: 'totalTax',
        header: 'Total Tax',
        className: 'text-right',
        render: (row) => <Amount value={Number(row.totalTax)} />,
      },
    ],
    [],
  )

  if (gstScheme === 'composition') {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ITC Register</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={supplierId}
          onValueChange={(val) => {
            setSupplierId(val === '__all__' ? '' : (val ?? ''))
            setOffset(0)
          }}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range)
            setOffset(0)
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <DataTable<ItcEntry> data={items} columns={columns} loading={false} />

          {/* Summary Row */}
          {items.length > 0 && (
            <Card>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total CGST</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {formatIndianCurrency(summary.cgst)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total SGST</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {formatIndianCurrency(summary.sgst)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total IGST</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {formatIndianCurrency(summary.igst)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Showing {items.length} entries
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
