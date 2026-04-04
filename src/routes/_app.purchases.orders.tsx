import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import { listPurchaseOrders, type POFilters } from '@/api/purchase-orders.api'
import { listSuppliers } from '@/api/suppliers.api'
import type { PurchaseOrder, Supplier } from '@/types/models'
import type { POStatus } from '@/types/enums'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { DataTable, type Column } from '@/components/data/data-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/purchases/orders')({
  component: PurchaseOrderListPage,
})

const PAGE_SIZE = 20

function statusVariant(
  status: POStatus,
): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'sent':
      return 'info'
    case 'partial':
      return 'warning'
    case 'received':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [offset, setOffset] = useState(0)

  const filters: POFilters = useMemo(
    () => ({
      supplier_id: supplierId,
      status: statusFilter,
      limit: PAGE_SIZE,
      offset,
    }),
    [supplierId, statusFilter, offset],
  )

  const { data: suppliersData } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => listSuppliers().then((res) => res.data),
  })

  const suppliers = suppliersData ?? []

  const { data: poData, isLoading } = useQuery({
    queryKey: queryKeys.purchaseOrders.list(
      filters as unknown as Record<string, unknown>,
    ),
    queryFn: () => listPurchaseOrders(filters).then((res) => res.data),
  })

  const items = poData?.items ?? []
  const hasMore = poData?.hasMore ?? false

  function supplierName(po: PurchaseOrder): string {
    if (po.supplier?.name) return po.supplier.name
    const found = suppliers.find((s: Supplier) => s.id === po.supplierId)
    return found?.name ?? 'Unknown'
  }

  function handleSupplierChange(value: string | null) {
    setSupplierId(!value || value === '__all__' ? undefined : value)
    setOffset(0)
  }

  function handleStatusChange(value: string | null) {
    setStatusFilter(!value || value === '__all__' ? undefined : value)
    setOffset(0)
  }

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (item) => (
        <span className="font-mono text-sm font-medium">{item.poNumber}</span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (item) => (
        <span className="font-medium">{supplierName(item)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <span className="text-sm">
          {format(new Date(item.createdAt), 'dd MMM yyyy')}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <StatusBadge variant={statusVariant(item.status)}>
          {item.status}
        </StatusBadge>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (item) => (
        <Amount value={parseFloat(item.totalAmount)} />
      ),
    },
  ]

  const mobileCard = (item: PurchaseOrder) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium font-mono">
              {item.poNumber}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {supplierName(item)} |{' '}
              {format(new Date(item.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Amount
              value={parseFloat(item.totalAmount)}
              className="text-sm font-bold"
            />
            <StatusBadge variant={statusVariant(item.status)}>
              {item.status}
            </StatusBadge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage purchase orders to suppliers.
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/purchases/orders/new' })}>
          <Plus className="mr-1 size-4" />
          Create PO
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Supplier</Label>
          <Select
            value={supplierId ?? '__all__'}
            onValueChange={handleSupplierChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Suppliers</SelectItem>
              {suppliers.map((s: Supplier) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter ?? '__all__'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(supplierId || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSupplierId(undefined)
              setStatusFilter(undefined)
              setOffset(0)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable<PurchaseOrder>
        data={items}
        columns={columns}
        loading={isLoading}
        emptyMessage="No purchase orders found"
        mobileCard={mobileCard}
        onRowClick={(item) =>
          navigate({
            to: '/purchases/orders/$id',
            params: { id: item.id },
          })
        }
      />

      {/* Empty state when no data */}
      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No purchase orders yet"
          description="Create your first purchase order to track supplier orders."
          action={{
            label: 'Create PO',
            onClick: () => navigate({ to: '/purchases/orders/new' }),
          }}
        />
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}&ndash;{offset + items.length} orders
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
