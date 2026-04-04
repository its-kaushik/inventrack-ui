import { useState, useMemo, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Loader2,
  Search,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import {
  createStockAudit,
  listStockAudits,
  approveStockAudit,
  type StockAuditFilters,
} from '@/api/stock-audits.api'
import { listProducts, type ProductFilters } from '@/api/products.api'
import { searchProducts } from '@/api/products.api'
import { listCategories } from '@/api/categories.api'
import type { Product, StockAudit, Category } from '@/types/models'
import { useDebounce } from '@/hooks/use-debounce'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { DataTable, type Column } from '@/components/data/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/inventory/audits')({
  component: StockAuditPage,
})

// ---------- Schema ----------

const auditLineSchema = z.object({
  productId: z.string().min(1),
  productName: z.string(),
  sku: z.string(),
  expectedQuantity: z.number(),
  countedQuantity: z.number().int().min(0, 'Count must be >= 0'),
})

const auditSchema = z.object({
  lines: z.array(auditLineSchema).min(1, 'Add at least one product to audit'),
})

type AuditFormValues = z.infer<typeof auditSchema>

const PAGE_SIZE = 20

// ---------- Page ----------

function StockAuditPage() {
  const queryClient = useQueryClient()

  // -- New Audit State --
  const [productSearch, setProductSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const debouncedSearch = useDebounce(productSearch, 300)

  // -- History State --
  const [historyOffset, setHistoryOffset] = useState(0)
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null)

  // Categories
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })
  const categories = categoriesData ?? []

  // Product search results
  const { data: searchResults = [] } = useQuery({
    queryKey: queryKeys.products.search(debouncedSearch),
    queryFn: () => searchProducts(debouncedSearch).then((res) => res.data),
    enabled: debouncedSearch.length >= 2,
  })

  // Products by category for bulk add
  const categoryProductFilters: ProductFilters = useMemo(
    () => ({
      category_id: categoryFilter,
      limit: 100,
      offset: 0,
    }),
    [categoryFilter],
  )

  const { data: categoryProducts } = useQuery({
    queryKey: queryKeys.products.list(categoryProductFilters as unknown as Record<string, unknown>),
    queryFn: () => listProducts(categoryProductFilters).then((res) => res.data),
    enabled: !!categoryFilter,
  })

  // Form
  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      lines: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  const watchedLines = watch('lines')

  // Add product to audit
  const handleAddProduct = useCallback(
    (product: Product) => {
      // Don't add duplicates
      const exists = watchedLines.some((l) => l.productId === product.id)
      if (exists) {
        toast.error('Product already added to audit.')
        return
      }
      append({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        expectedQuantity: product.currentStock ?? 0,
        countedQuantity: 0,
      })
      setProductSearch('')
      setSearchOpen(false)
    },
    [watchedLines, append],
  )

  // Bulk add from category
  function handleAddCategory() {
    const products = Array.isArray(categoryProducts) ? categoryProducts : []
    if (products.length === 0) return
    let added = 0
    for (const product of products) {
      const exists = watchedLines.some((l) => l.productId === product.id)
      if (!exists) {
        append({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          expectedQuantity: product.currentStock ?? 0,
          countedQuantity: 0,
        })
        added++
      }
    }
    if (added > 0) {
      toast.success(`Added ${added} products from category.`)
    } else {
      toast.info('All products from this category are already added.')
    }
  }

  // Variance calculations
  const auditSummary = useMemo(() => {
    let matches = 0
    let over = 0
    let short = 0
    for (const line of watchedLines) {
      const variance = (line.countedQuantity ?? 0) - line.expectedQuantity
      if (variance === 0) matches++
      else if (variance > 0) over++
      else short++
    }
    return {
      total: watchedLines.length,
      matches,
      over,
      short,
    }
  }, [watchedLines])

  // Create audit mutation
  const createMutation = useMutation({
    mutationFn: (data: AuditFormValues) =>
      createStockAudit({
        lines: data.lines.map((l) => ({
          productId: l.productId,
          countedQuantity: l.countedQuantity,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stockAudits.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.all(),
      })
      toast.success('Stock audit submitted successfully.')
      reset()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit stock audit.')
    },
  })

  function onSubmit(data: AuditFormValues) {
    createMutation.mutate(data)
  }

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (auditId: string) => approveStockAudit(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stockAudits.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.all(),
      })
      toast.success('Audit approved and stock adjusted.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to approve audit.')
    },
  })

  // History
  const historyFilters: StockAuditFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: historyOffset,
    }),
    [historyOffset],
  )

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: queryKeys.stockAudits.list(historyFilters as unknown as Record<string, unknown>),
    queryFn: () => listStockAudits(historyFilters).then((res) => res.data),
  })

  const historyItems = historyData?.items ?? []
  const hasMore = historyData?.hasMore ?? false

  const historyColumns: Column<StockAudit>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <span className="text-sm">{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (item) => <span className="text-sm">{item.user?.name ?? '-'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'items',
      header: 'Items',
      render: (item) => <span className="text-sm tabular-nums">{item.lines?.length ?? 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <StatusBadge variant={item.status === 'completed' ? 'success' : 'warning'}>
          {item.status === 'completed' ? 'Completed' : 'In Progress'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedAuditId(expandedAuditId === item.id ? null : item.id)
            }}
          >
            {expandedAuditId === item.id ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
          {item.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                approveMutation.mutate(item.id)
              }}
              disabled={approveMutation.isPending}
            >
              <CheckCircle2 className="mr-1 size-3.5" />
              Approve & Adjust
            </Button>
          )}
        </div>
      ),
    },
  ]

  const mobileCard = (item: StockAudit) => (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.user?.name ?? '-'} | {item.lines?.length ?? 0} items
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge variant={item.status === 'completed' ? 'success' : 'warning'}>
              {item.status === 'completed' ? 'Completed' : 'In Progress'}
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
        <h1 className="text-2xl font-bold">Stock Audits</h1>
        <p className="text-sm text-muted-foreground">
          Count physical inventory and reconcile with system records.
        </p>
      </div>

      {/* Start New Audit */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Start New Audit</legend>

          {/* Product selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* By search */}
            <div className="space-y-1.5">
              <Label>Add Product</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search by name or SKU..."
                />
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-md">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          Stock: {product.currentStock ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* By category */}
            <div className="space-y-1.5">
              <Label>Add by Category</Label>
              <div className="flex gap-2">
                <Select
                  value={categoryFilter ?? '__none__'}
                  onValueChange={(val) =>
                    setCategoryFilter(!val || val === '__none__' ? undefined : val)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select category...</SelectItem>
                    {categories.map((c: Category) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!categoryFilter}
                  onClick={handleAddCategory}
                >
                  Add All
                </Button>
              </div>
            </div>
          </div>

          {errors.lines?.message && (
            <p className="text-xs text-destructive">{errors.lines.message}</p>
          )}

          {/* Audit lines */}
          {fields.length > 0 && (
            <div className="space-y-2">
              {/* Desktop header */}
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground lg:grid">
                <span>Product</span>
                <span>SKU</span>
                <span className="text-right">Expected</span>
                <span className="text-right">Counted</span>
                <span className="text-right">Variance</span>
                <span className="w-8" />
              </div>

              {fields.map((field, index) => {
                const line = watchedLines[index]
                const variance = (line?.countedQuantity ?? 0) - (line?.expectedQuantity ?? 0)

                return (
                  <div key={field.id}>
                    {/* Desktop row */}
                    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 rounded-md border p-2 lg:grid">
                      <span className="truncate text-sm font-medium">{line?.productName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{line?.sku}</span>
                      <span className="text-right font-mono text-sm tabular-nums">
                        {line?.expectedQuantity ?? 0}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-right text-sm"
                        {...register(`lines.${index}.countedQuantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      <span
                        className={`text-right font-mono text-sm font-medium tabular-nums ${
                          variance > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : variance < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {variance > 0 ? '+' : ''}
                        {variance}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => remove(index)}
                      >
                        &times;
                      </Button>
                    </div>

                    {/* Mobile card */}
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3 lg:hidden">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line?.productName}</p>
                          <p className="text-xs text-muted-foreground">{line?.sku}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => remove(index)}
                        >
                          &times;
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Expected</p>
                          <p className="font-mono tabular-nums">{line?.expectedQuantity ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Counted</p>
                          <Input
                            type="number"
                            min={0}
                            className="h-7 text-sm"
                            {...register(`lines.${index}.countedQuantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Variance</p>
                          <p
                            className={`font-mono font-medium tabular-nums ${
                              variance > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : variance < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {variance > 0 ? '+' : ''}
                            {variance}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary card */}
          {watchedLines.length > 0 && (
            <Card size="sm">
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{auditSummary.total}</p>
                    <p className="text-xs text-muted-foreground">Items Audited</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {auditSummary.matches}
                    </p>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {auditSummary.over}
                    </p>
                    <p className="text-xs text-muted-foreground">Over</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
                      {auditSummary.short}
                    </p>
                    <p className="text-xs text-muted-foreground">Short</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {watchedLines.length > 0 && (
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Submit Audit
            </Button>
          )}

          {watchedLines.length === 0 && (
            <EmptyState
              icon={Search}
              title="No products added"
              description="Search for products or select a category to begin the audit."
            />
          )}
        </fieldset>
      </form>

      {/* Audit History */}
      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Audit History</h2>

        <DataTable<StockAudit>
          data={historyItems}
          columns={historyColumns}
          loading={isLoadingHistory}
          emptyMessage="No audits recorded yet"
          mobileCard={mobileCard}
          onRowClick={(item) => setExpandedAuditId(expandedAuditId === item.id ? null : item.id)}
        />

        {/* Expanded variance details */}
        {expandedAuditId &&
          historyItems.map(
            (audit) =>
              audit.id === expandedAuditId &&
              audit.lines &&
              audit.lines.length > 0 && (
                <Card key={`detail-${audit.id}`} size="sm">
                  <CardHeader>
                    <CardTitle>
                      Variance Details - {format(new Date(audit.createdAt), 'dd MMM yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {/* Header */}
                      <div className="grid grid-cols-5 gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                        <span className="col-span-2">Product</span>
                        <span className="text-right">Expected</span>
                        <span className="text-right">Counted</span>
                        <span className="text-right">Variance</span>
                      </div>
                      {audit.lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-5 gap-2 px-4 py-2 text-sm">
                          <span className="col-span-2 truncate font-medium">
                            {line.product?.name ?? line.productId}
                          </span>
                          <span className="text-right font-mono tabular-nums">
                            {line.expectedQuantity}
                          </span>
                          <span className="text-right font-mono tabular-nums">
                            {line.countedQuantity}
                          </span>
                          <span
                            className={`text-right font-mono font-medium tabular-nums ${
                              line.variance > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : line.variance < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {line.variance > 0 ? '+' : ''}
                            {line.variance}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Approve action */}
                    {audit.status === 'completed' && (
                      <div className="border-t px-4 py-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => approveMutation.mutate(audit.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Approve & Adjust Stock
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ),
          )}

        {!isLoadingHistory && historyItems.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="No audits yet"
            description="Submit a stock audit to see history here."
          />
        )}

        {historyItems.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {historyOffset + 1}&ndash;
              {historyOffset + historyItems.length} audits
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={historyOffset === 0}
                onClick={() => setHistoryOffset(Math.max(0, historyOffset - PAGE_SIZE))}
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setHistoryOffset(historyOffset + PAGE_SIZE)}
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
