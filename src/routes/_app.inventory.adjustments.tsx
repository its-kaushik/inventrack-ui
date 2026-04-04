import { useState, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import {
  createStockAdjustment,
  listStockAdjustments,
  type StockAdjustmentFilters,
} from '@/api/stock-adjustments.api'
import { searchProducts } from '@/api/products.api'
import { getProductStock } from '@/api/stock.api'
import type { Product, StockAdjustment } from '@/types/models'
import { useDebounce } from '@/hooks/use-debounce'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { DataTable, type Column } from '@/components/data/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/inventory/adjustments')({
  component: StockAdjustmentPage,
})

// ---------- Schema ----------

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  quantityChange: z
    .number()
    .int('Must be a whole number')
    .refine((val) => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(
    ['damage', 'theft', 'count_correction', 'write_off', 'expired', 'other'] as const,
    {
      error: 'Reason is required',
    },
  ),
  notes: z.string().optional(),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

const ADJUSTMENT_REASONS = [
  { value: 'damage', label: 'Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'count_correction', label: 'Count Correction' },
  { value: 'write_off', label: 'Write Off' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
]

const PAGE_SIZE = 20

// ---------- Product Search ----------

function ProductSearchInput({
  value,
  productName,
  onSelect,
}: {
  value: string
  productName: string
  onSelect: (product: Product) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  const { data: results = [] } = useQuery({
    queryKey: queryKeys.products.search(debouncedQuery),
    queryFn: () => searchProducts(debouncedQuery).then((res) => res.data),
    enabled: debouncedQuery.length >= 2,
  })

  const handleSelect = useCallback(
    (product: Product) => {
      onSelect(product)
      setQuery('')
      setOpen(false)
    },
    [onSelect],
  )

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <span className="flex-1 text-sm font-medium">{productName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onSelect({
                id: '',
                name: '',
                sku: '',
                costPrice: 0,
              } as Product)
              setOpen(true)
            }}
          >
            <Search className="size-3" />
          </Button>
        </div>
      ) : (
        <div>
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, SKU, or barcode..."
          />
          {open && results.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-md">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect(product)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku}
                      {product.size ? ` | ${product.size}` : ''}
                    </p>
                  </div>
                  {product.currentStock !== undefined && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Stock: {product.currentStock}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {open && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Page ----------

function StockAdjustmentPage() {
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: '',
      productName: '',
      quantityChange: 0,
      reason: 'damage',
      notes: '',
    },
  })

  const watchedProductId = watch('productId')

  // Fetch current stock for selected product
  const { data: stockData } = useQuery({
    queryKey: queryKeys.stock.detail(watchedProductId),
    queryFn: () => getProductStock(watchedProductId).then((res) => res.data),
    enabled: watchedProductId.length > 0,
  })

  // History list
  const historyFilters: StockAdjustmentFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
    }),
    [offset],
  )

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: queryKeys.stockAdjustments.list(historyFilters as unknown as Record<string, unknown>),
    queryFn: () => listStockAdjustments(historyFilters).then((res) => res.data),
  })

  const historyItems = historyData?.items ?? []
  const hasMore = historyData?.hasMore ?? false

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: AdjustmentFormValues) =>
      createStockAdjustment({
        productId: data.productId,
        quantityChange: data.quantityChange,
        reason: data.reason,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stockAdjustments.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.all(),
      })
      toast.success('Stock adjustment recorded successfully.')
      reset()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record stock adjustment.')
    },
  })

  function onSubmit(data: AdjustmentFormValues) {
    mutation.mutate(data)
  }

  function reasonLabel(reason: string): string {
    const found = ADJUSTMENT_REASONS.find((r) => r.value === reason)
    return found?.label ?? reason
  }

  function reasonVariant(reason: string): 'default' | 'warning' | 'error' | 'info' {
    switch (reason) {
      case 'damage':
        return 'warning'
      case 'theft':
        return 'error'
      case 'count_correction':
        return 'info'
      case 'write_off':
        return 'error'
      default:
        return 'default'
    }
  }

  const historyColumns: Column<StockAdjustment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <span className="text-sm">{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <span className="text-sm font-medium">{item.product?.name ?? item.productId}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty Change',
      render: (item) => (
        <span
          className={`font-mono text-sm font-medium tabular-nums ${
            item.quantityChange > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {item.quantityChange > 0 ? '+' : ''}
          {item.quantityChange}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item) => (
        <StatusBadge variant={reasonVariant(item.reason)}>{reasonLabel(item.reason)}</StatusBadge>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => <span className="text-sm text-muted-foreground">{item.notes ?? '-'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'user',
      header: 'User',
      render: (item) => (
        <span className="text-sm text-muted-foreground">{item.user?.name ?? '-'}</span>
      ),
      hideOnMobile: true,
    },
  ]

  const mobileCard = (item: StockAdjustment) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.product?.name ?? item.productId}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`font-mono text-sm font-medium tabular-nums ${
                item.quantityChange > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {item.quantityChange > 0 ? '+' : ''}
              {item.quantityChange}
            </span>
            <StatusBadge variant={reasonVariant(item.reason)}>
              {reasonLabel(item.reason)}
            </StatusBadge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Stock Adjustments</h1>
        <p className="text-sm text-muted-foreground">
          Adjust inventory for damage, theft, corrections, or write-offs.
        </p>
      </div>

      {/* Adjustment Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">New Adjustment</legend>

          {/* Product Search */}
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <ProductSearchInput
                  value={field.value}
                  productName={watch('productName')}
                  onSelect={(product) => {
                    setValue('productId', product.id)
                    setValue('productName', product.name)
                  }}
                />
              )}
            />
            {errors.productId && (
              <p className="text-xs text-destructive">{errors.productId.message}</p>
            )}
          </div>

          {/* Product info when selected */}
          {watchedProductId && stockData && (
            <Card size="sm">
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{stockData.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SKU</p>
                    <p className="font-mono text-xs">{stockData.sku}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Stock</p>
                    <p className="font-mono font-bold tabular-nums">{stockData.currentStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantity Adjustment */}
          <div className="space-y-1.5">
            <Label>Quantity Adjustment *</Label>
            <p className="text-xs text-muted-foreground">
              Positive = add stock, Negative = remove stock
            </p>
            <Input
              type="number"
              {...register('quantityChange', { valueAsNumber: true })}
              placeholder="e.g. -5 or +10"
              aria-invalid={!!errors.quantityChange}
            />
            {errors.quantityChange && (
              <p className="text-xs text-destructive">{errors.quantityChange.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={!!errors.reason}>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes about this adjustment..."
              {...register('notes')}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Submit Adjustment
          </Button>
        </fieldset>
      </form>

      {/* History */}
      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Adjustment History</h2>

        <DataTable<StockAdjustment>
          data={historyItems}
          columns={historyColumns}
          loading={isLoadingHistory}
          emptyMessage="No adjustments recorded yet"
          mobileCard={mobileCard}
        />

        {!isLoadingHistory && historyItems.length === 0 && (
          <EmptyState
            icon={SlidersHorizontal}
            title="No adjustments yet"
            description="Stock adjustments will appear here after you submit one."
          />
        )}

        {historyItems.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}&ndash;{offset + historyItems.length} adjustments
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
    </div>
  )
}
