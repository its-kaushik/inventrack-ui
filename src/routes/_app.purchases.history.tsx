import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import { listPurchases, type PurchaseFilters } from '@/api/purchases.api'
import { listSuppliers } from '@/api/suppliers.api'
import type { Purchase, Supplier } from '@/types/models'
import { formatIndianCurrency } from '@/lib/format-currency'
import { DataTable, type Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_app/purchases/history')({
  component: PurchaseHistoryPage,
})

const PAGE_SIZE = 20

function PurchaseHistoryPage() {
  const navigate = useNavigate()
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  const filters: PurchaseFilters = useMemo(
    () => ({
      supplier_id: supplierId,
      limit: PAGE_SIZE,
      offset,
    }),
    [supplierId, offset],
  )

  const { data: suppliersData } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => listSuppliers().then((res) => res.data),
  })

  const suppliers = suppliersData ?? []

  const { data: purchaseData, isLoading } = useQuery({
    queryKey: queryKeys.purchases.list(
      filters as unknown as Record<string, unknown>,
    ),
    queryFn: () => listPurchases(filters).then((res) => res.data),
  })

  const allItems = purchaseData?.items ?? []
  const hasMore = purchaseData?.hasMore ?? false

  // Client-side date filter (the API may not support date range)
  const items = useMemo(() => {
    let filtered = allItems
    if (dateFrom) {
      filtered = filtered.filter(
        (p) => (p.invoiceDate ?? p.createdAt) >= dateFrom,
      )
    }
    if (dateTo) {
      filtered = filtered.filter(
        (p) => (p.invoiceDate ?? p.createdAt) <= dateTo + 'T23:59:59',
      )
    }
    return filtered
  }, [allItems, dateFrom, dateTo])

  function supplierName(purchase: Purchase): string {
    if (purchase.supplier?.name) return purchase.supplier.name
    const found = suppliers.find((s: Supplier) => s.id === purchase.supplierId)
    return found?.name ?? 'Unknown'
  }

  function handleSupplierChange(value: string | null) {
    setSupplierId(!value || value === '__all__' ? undefined : value)
    setOffset(0)
  }

  const columns: Column<Purchase>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <span className="text-sm">
          {format(
            new Date(item.invoiceDate ?? item.createdAt),
            'dd MMM yyyy',
          )}
        </span>
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
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (item) => (
        <span className="font-mono text-xs">
          {item.invoiceNumber || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (item) => (
        <Amount value={parseFloat(item.totalAmount)} />
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {item.items?.length ?? '-'}
        </span>
      ),
      hideOnMobile: true,
    },
  ]

  const mobileCard = (item: Purchase) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {supplierName(item)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(
                new Date(item.invoiceDate ?? item.createdAt),
                'dd MMM yyyy',
              )}
              {item.invoiceNumber ? ` | ${item.invoiceNumber}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <Amount
              value={parseFloat(item.totalAmount)}
              className="text-sm font-bold"
            />
            {item.items && (
              <span className="text-xs text-muted-foreground">
                {item.items.length} item{item.items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase History</h1>
          <p className="text-sm text-muted-foreground">
            View all recorded goods receipts.
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/purchases/receive' })}>
          <Plus className="mr-1 size-4" />
          New Purchase
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
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setOffset(0)
            }}
            className="w-auto"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setOffset(0)
            }}
            className="w-auto"
          />
        </div>

        {(supplierId || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSupplierId(undefined)
              setDateFrom('')
              setDateTo('')
              setOffset(0)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Purchase Detail Sheet */}
      <Sheet
        open={!!selectedPurchase}
        onOpenChange={(open) => {
          if (!open) setSelectedPurchase(null)
        }}
      >
        {/* Data Table */}
        <DataTable<Purchase>
          data={items}
          columns={columns}
          loading={isLoading}
          emptyMessage="No purchases found"
          mobileCard={mobileCard}
          onRowClick={(item) => setSelectedPurchase(item)}
        />

        {/* Detail Sheet */}
        {selectedPurchase && (
          <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Purchase Details</SheetTitle>
              <SheetDescription>
                {selectedPurchase.invoiceNumber
                  ? `Invoice ${selectedPurchase.invoiceNumber}`
                  : 'No invoice number'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">
                    {supplierName(selectedPurchase)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(
                      new Date(
                        selectedPurchase.invoiceDate ??
                          selectedPurchase.createdAt,
                      ),
                      'dd MMM yyyy',
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-mono font-bold tabular-nums">
                    {formatIndianCurrency(
                      parseFloat(selectedPurchase.totalAmount),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">RCM</p>
                  <p className="font-medium">
                    {selectedPurchase.isRcm ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Tax breakdown */}
              {(selectedPurchase.cgstAmount ||
                selectedPurchase.sgstAmount ||
                selectedPurchase.igstAmount) && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Tax Breakdown</p>
                    {selectedPurchase.cgstAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST</span>
                        <span className="font-mono tabular-nums">
                          {formatIndianCurrency(
                            parseFloat(selectedPurchase.cgstAmount),
                          )}
                        </span>
                      </div>
                    )}
                    {selectedPurchase.sgstAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST</span>
                        <span className="font-mono tabular-nums">
                          {formatIndianCurrency(
                            parseFloat(selectedPurchase.sgstAmount),
                          )}
                        </span>
                      </div>
                    )}
                    {selectedPurchase.igstAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IGST</span>
                        <span className="font-mono tabular-nums">
                          {formatIndianCurrency(
                            parseFloat(selectedPurchase.igstAmount),
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Line items */}
              {selectedPurchase.items && selectedPurchase.items.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Items ({selectedPurchase.items.length})
                    </p>
                    {selectedPurchase.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {item.productId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x{' '}
                            {formatIndianCurrency(parseFloat(item.costPrice))}
                            {item.gstRate > 0
                              ? ` + ${item.gstRate}% GST`
                              : ''}
                          </p>
                        </div>
                        <span className="font-mono text-sm tabular-nums">
                          {formatIndianCurrency(
                            parseFloat(item.costPrice) * item.quantity +
                              parseFloat(item.gstAmount ?? '0'),
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Empty state when no data */}
      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title="No purchases yet"
          description="Record your first goods receipt to see it here."
          action={{
            label: 'Record Purchase',
            onClick: () => navigate({ to: '/purchases/receive' }),
          }}
        />
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}&ndash;{offset + items.length} purchases
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
