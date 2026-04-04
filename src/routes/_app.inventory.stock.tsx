import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  PackageCheck,
  AlertTriangle,
  PackageX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getStockOverview, type StockFilters } from '@/api/stock.api'
import { listCategories } from '@/api/categories.api'
import type { StockItem } from '@/types/models'
import type { StockStatus } from '@/types/enums'
import { KpiCard } from '@/components/data/kpi-card'
import { DataTable, type Column } from '@/components/data/data-table'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/inventory/stock')({
  component: StockOverviewPage,
})

const PAGE_SIZE = 20

const statusVariantMap: Record<StockStatus, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  low: 'warning',
  out: 'error',
}

const statusLabelMap: Record<StockStatus, string> = {
  healthy: 'In Stock',
  low: 'Low',
  out: 'Out of Stock',
}

function StockOverviewPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [offset, setOffset] = useState(0)

  const filters: StockFilters = useMemo(
    () => ({
      category_id: categoryId,
      status: status,
      limit: PAGE_SIZE,
      offset,
    }),
    [categoryId, status, offset],
  )

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })

  const { data: stockData, isLoading } = useQuery({
    queryKey: queryKeys.stock.list(filters as unknown as Record<string, unknown>),
    queryFn: () => getStockOverview(filters).then((res) => res.data),
  })

  const items = stockData?.items ?? []
  const summary = stockData?.summary
  const hasMore = stockData?.hasMore ?? false

  function handleCategoryChange(value: string | null) {
    setCategoryId(!value || value === '__all__' ? undefined : value)
    setOffset(0)
  }

  function handleStatusChange(value: string | null) {
    setStatus(!value || value === '__all__' ? undefined : value)
    setOffset(0)
  }

  const columns: Column<StockItem>[] = [
    {
      key: 'name',
      header: 'Product Name',
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (item) => <span className="font-mono text-xs">{item.sku}</span>,
      hideOnMobile: true,
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      render: (item) => <span className="font-bold tabular-nums">{item.currentStock}</span>,
      sortable: true,
    },
    {
      key: 'minStockLevel',
      header: 'Min Stock Level',
      render: (item) => <span className="tabular-nums text-muted-foreground">{item.minStockLevel}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <StatusBadge variant={statusVariantMap[item.status]}>
          {statusLabelMap[item.status]}
        </StatusBadge>
      ),
    },
  ]

  const mobileCard = (item: StockItem) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.sku}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums">{item.currentStock}</span>
            <StatusBadge variant={statusVariantMap[item.status]}>
              {statusLabelMap[item.status]}
            </StatusBadge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor inventory levels across all products.
        </p>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={Package}
            label="Total SKUs"
            value={summary.total}
          />
          <KpiCard
            icon={PackageCheck}
            label="In Stock"
            value={summary.inStock}
            className="[&_[data-slot=card]]:border-emerald-200 dark:[&_[data-slot=card]]:border-emerald-900/30"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Low Stock"
            value={summary.low}
            className="[&_[data-slot=card]]:border-amber-200 dark:[&_[data-slot=card]]:border-amber-900/30"
          />
          <KpiCard
            icon={PackageX}
            label="Out of Stock"
            value={summary.out}
            className="[&_[data-slot=card]]:border-red-200 dark:[&_[data-slot=card]]:border-red-900/30"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryId ?? '__all__'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {(categoriesData ?? []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status ?? '__all__'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable<StockItem>
        data={items}
        columns={columns}
        loading={isLoading}
        emptyMessage="No stock data found"
        mobileCard={mobileCard}
      />

      {/* Empty state when no data and not loading */}
      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={Package}
          title="No stock data"
          description="Stock information will appear here once products are added."
        />
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}&ndash;{offset + items.length} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft className="mr-1 size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
