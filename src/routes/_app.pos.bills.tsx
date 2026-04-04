import { useState, useMemo, useCallback } from 'react'
import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Receipt, ArrowLeft } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listBills } from '@/api/bills.api'
import type { BillFilters } from '@/api/bills.api'
import type { Bill } from '@/types/models'
import type { PaymentMode } from '@/types/enums'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { SearchInput } from '@/components/form/search-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/format-date'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/pos/bills')({
  component: BillHistoryPage,
})

const PAGE_SIZE = 25

function paymentModeLabel(mode: PaymentMode): string {
  const labels: Record<PaymentMode, string> = {
    cash: 'Cash',
    upi: 'UPI',
    card: 'Card',
    credit: 'Credit',
  }
  return labels[mode] ?? mode
}

function getStatusVariant(
  status: string,
): 'success' | 'error' | 'default' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'voided':
      return 'error'
    default:
      return 'default'
  }
}

function BillHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filters: BillFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
    }),
    [],
  )

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.bills.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam = 0 }) =>
      listBills({ ...filters, offset: pageParam }).then((res) => res.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + PAGE_SIZE : undefined,
  })

  const allBills = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )

  // Client-side filter by bill number
  const filteredBills = useMemo(() => {
    if (!search) return allBills
    const q = search.toLowerCase()
    return allBills.filter(
      (b) =>
        b.billNumber.toLowerCase().includes(q) ||
        (b.customer?.name?.toLowerCase().includes(q) ?? false),
    )
  }, [allBills, search])

  const handleRowClick = useCallback(
    (bill: Bill) => {
      navigate({ to: '/pos/bills/$id', params: { id: bill.id } })
    },
    [navigate],
  )

  const columns: Column<Bill>[] = useMemo(
    () => [
      {
        key: 'billNumber',
        header: 'Bill #',
        sortable: true,
        render: (b) => (
          <span className="font-mono text-sm font-medium">
            {b.billNumber}
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        render: (b) => (
          <span className="text-sm">{formatDateTime(b.createdAt)}</span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        hideOnMobile: true,
        render: (b) => (
          <span className="text-sm">
            {b.customer?.name ?? 'Walk-in'}
          </span>
        ),
      },
      {
        key: 'netAmount',
        header: 'Amount',
        sortable: true,
        className: 'text-right',
        render: (b) => (
          <Amount value={parseFloat(b.netAmount)} className="text-sm" />
        ),
      },
      {
        key: 'paymentModes',
        header: 'Payment',
        hideOnMobile: true,
        render: (b) => (
          <div className="flex flex-wrap gap-1">
            {b.payments?.map((p, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {paymentModeLabel(p.mode)}
              </Badge>
            )) ?? <span className="text-xs text-muted-foreground">--</span>}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (b) => (
          <StatusBadge variant={getStatusVariant(b.status)}>
            {b.status}
          </StatusBadge>
        ),
      },
    ],
    [],
  )

  const mobileCard = useCallback(
    (bill: Bill) => (
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-medium">
                {bill.billNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {bill.customer?.name ?? 'Walk-in'} &middot;{' '}
                {formatDate(bill.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Amount
                value={parseFloat(bill.netAmount)}
                className="text-sm font-semibold"
              />
              <StatusBadge variant={getStatusVariant(bill.status)}>
                {bill.status}
              </StatusBadge>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  )

  const isEmpty = !isLoading && filteredBills.length === 0 && !search

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/pos">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold lg:text-2xl">Bill History</h1>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by bill number or customer..."
        className="w-full sm:max-w-sm"
      />

      {/* Data */}
      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="No bills yet"
          description="Bills will appear here after your first sale."
        />
      ) : (
        <>
          <DataTable<Bill>
            data={filteredBills}
            columns={columns}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyMessage="No bills match your search"
            mobileCard={mobileCard}
          />

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
