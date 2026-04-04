import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Minus,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listBills } from '@/api/bills.api'
import { createReturn, getReturnableItems } from '@/api/returns.api'
import type { CreateReturnData } from '@/api/returns.api'
import type { Bill, Product } from '@/types/models'
import { useTenant } from '@/hooks/use-tenant'
import { useRole } from '@/hooks/use-role'
import { useProductSearch } from '@/hooks/use-product-search'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { SearchInput } from '@/components/form/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/format-date'
import { formatIndianCurrency } from '@/lib/format-currency'

export const Route = createFileRoute('/_app/pos/returns')({
  beforeLoad: ({ context }) => {
    const role = context.auth.user?.role
    if (role === 'salesperson') {
      throw redirect({ to: '/pos' })
    }
  },
  component: ReturnsPage,
})

// ---------- Types ----------

interface SelectedReturnItem {
  billItemId: string
  productId: string
  productName: string
  sku: string
  size: string | null
  originalQuantity: number
  returnedQuantity: number
  returnableQuantity: number
  unitPrice: number
  catalogDiscountPct: number
  selected: boolean
  returnQty: number
  reason: string
}

interface ExchangeItem {
  productId: string
  productName: string
  size: string | null
  sellingPrice: number
  quantity: number
}

const RETURN_REASONS = [
  { value: 'size_issue', label: 'Size Issue' },
  { value: 'defect', label: 'Defect' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'other', label: 'Other' },
]

// ---------- Page ----------

function ReturnsPage() {
  const navigate = useNavigate()
  const { settings } = useTenant()
  const { canProcessReturn } = useRole()

  // Step tracking
  const [step, setStep] = useState(0)

  // Step 0: Bill lookup
  const [billSearch, setBillSearch] = useState('')
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  // Step 1: Return items selection
  const [returnItems, setReturnItems] = useState<SelectedReturnItem[]>([])

  // Step 2: Refund mode
  const [refundMode, setRefundMode] = useState<'cash' | 'credit_note' | 'exchange'>('cash')
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([])
  const [exchangeSearch, setExchangeSearch] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notes, setNotes] = useState('')

  // Recent bills query
  const { data: recentBillsData, isLoading: loadingRecent } = useQuery({
    queryKey: queryKeys.bills.list({ limit: 10 }),
    queryFn: () => listBills({ limit: 10 }).then((res) => res.data),
  })

  const recentBills = useMemo(
    () => recentBillsData?.items?.filter((b) => b.status === 'completed') ?? [],
    [recentBillsData],
  )

  // Search bills by bill number
  const { data: searchBillsData, isLoading: loadingSearch } = useQuery({
    queryKey: queryKeys.bills.list({ search: billSearch }),
    queryFn: () => listBills({ limit: 10 } as Record<string, unknown> & { limit: number }).then((res) => res.data),
    enabled: billSearch.length >= 2,
  })

  const searchResults = useMemo(() => {
    if (!billSearch || billSearch.length < 2) return []
    const q = billSearch.toLowerCase()
    return (
      searchBillsData?.items?.filter(
        (b) =>
          b.status === 'completed' &&
          (b.billNumber.toLowerCase().includes(q) ||
            b.customer?.name?.toLowerCase().includes(q)),
      ) ?? []
    )
  }, [searchBillsData, billSearch])

  // Returnable items query
  const { data: returnableData, isLoading: loadingReturnable } = useQuery({
    queryKey: queryKeys.returns.returnable(selectedBill?.id ?? ''),
    queryFn: () => getReturnableItems(selectedBill!.id).then((res) => res.data),
    enabled: !!selectedBill && step === 1,
  })

  // Product search for exchange
  const { results: exchangeSearchResults, isLoading: loadingExchangeSearch } =
    useProductSearch(exchangeSearch)

  // Return window check
  const isOutsideReturnWindow = useMemo(() => {
    if (!selectedBill || !settings?.return_window_days) return false
    const billDate = new Date(selectedBill.createdAt)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    return diffDays > settings.return_window_days
  }, [selectedBill, settings])

  // Initialize return items from query data
  const initReturnItems = useCallback(() => {
    if (!returnableData) return
    setReturnItems(
      returnableData.items.map((item) => ({
        billItemId: item.billItemId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        size: item.size,
        originalQuantity: item.originalQuantity,
        returnedQuantity: item.returnedQuantity,
        returnableQuantity: item.returnableQuantity,
        unitPrice: parseFloat(item.unitPrice),
        catalogDiscountPct: item.catalogDiscountPct,
        selected: false,
        returnQty: 0,
        reason: 'size_issue',
      })),
    )
  }, [returnableData])

  // Computed values
  const selectedItems = returnItems.filter((i) => i.selected && i.returnQty > 0)

  const totalRefund = selectedItems.reduce((sum, item) => {
    const effectivePrice = item.unitPrice * (1 - item.catalogDiscountPct / 100)
    return sum + effectivePrice * item.returnQty
  }, 0)

  const exchangeTotal = exchangeItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  )

  const priceDifference = exchangeTotal - totalRefund

  // Create return mutation
  const returnMutation = useMutation({
    mutationFn: (data: Omit<CreateReturnData, 'billId'>) =>
      createReturn(selectedBill!.id, data),
    onSuccess: () => {
      toast.success('Return processed successfully')
      navigate({ to: '/pos/bills/$id', params: { id: selectedBill!.id } })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process return',
      )
    },
  })

  function handleSelectBill(bill: Bill) {
    setSelectedBill(bill)
    setStep(1)
  }

  function handleBackToSearch() {
    setSelectedBill(null)
    setReturnItems([])
    setStep(0)
  }

  function handleProceedToRefund() {
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to return')
      return
    }
    setStep(2)
  }

  function handleAddExchangeItem(product: Product) {
    setExchangeItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          size: product.size,
          sellingPrice: product.sellingPrice,
          quantity: 1,
        },
      ]
    })
    setExchangeSearch('')
  }

  function handleRemoveExchangeItem(productId: string) {
    setExchangeItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function handleProcessReturn() {
    const data: Omit<CreateReturnData, 'billId'> = {
      items: selectedItems.map((item) => ({
        billItemId: item.billItemId,
        quantity: item.returnQty,
        reason: item.reason,
      })),
      refundMode,
      notes: notes || undefined,
    }

    if (refundMode === 'exchange' && exchangeItems.length > 0) {
      data.exchangeItems = exchangeItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    }

    returnMutation.mutate(data)
  }

  function toggleItem(billItemId: string) {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.billItemId === billItemId
          ? {
              ...item,
              selected: !item.selected,
              returnQty: !item.selected ? Math.min(1, item.returnableQuantity) : 0,
            }
          : item,
      ),
    )
  }

  function updateReturnQty(billItemId: string, qty: number) {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.billItemId === billItemId
          ? { ...item, returnQty: Math.max(0, Math.min(qty, item.returnableQuantity)) }
          : item,
      ),
    )
  }

  function updateReason(billItemId: string, reason: string) {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.billItemId === billItemId ? { ...item, reason } : item,
      ),
    )
  }

  // ---------- Render ----------

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step === 0 ? (
          <Link to="/pos">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (step === 2) setStep(1)
              else handleBackToSearch()
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <h1 className="text-xl font-bold lg:text-2xl">Returns & Exchanges</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepIndicator label="Find Bill" active={step === 0} done={step > 0} index={1} />
        <ArrowRight className="size-3 text-muted-foreground" />
        <StepIndicator label="Select Items" active={step === 1} done={step > 1} index={2} />
        <ArrowRight className="size-3 text-muted-foreground" />
        <StepIndicator label="Process Return" active={step === 2} done={false} index={3} />
      </div>

      {/* Step 0: Bill Lookup */}
      {step === 0 && (
        <div className="space-y-4">
          <SearchInput
            value={billSearch}
            onChange={setBillSearch}
            placeholder="Search by bill number or customer name..."
            className="w-full sm:max-w-md"
          />

          {billSearch.length >= 2 ? (
            <div className="space-y-2">
              {loadingSearch ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No completed bills found
                </p>
              ) : (
                searchResults.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onSelect={() => handleSelectBill(bill)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Recent Bills
              </h3>
              {loadingRecent ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentBills.length === 0 ? (
                <EmptyState
                  icon={RotateCcw}
                  title="No completed bills"
                  description="Complete a sale first to process returns."
                />
              ) : (
                recentBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onSelect={() => handleSelectBill(bill)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select Return Items */}
      {step === 1 && selectedBill && (
        <div className="space-y-4">
          {/* Selected bill info */}
          <Card size="sm">
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-medium">
                    {selectedBill.billNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBill.customer?.name ?? 'Walk-in'} &middot;{' '}
                    {formatDate(selectedBill.createdAt)}
                  </p>
                </div>
                <Amount
                  value={parseFloat(selectedBill.netAmount)}
                  className="text-sm font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Return window warning */}
          {isOutsideReturnWindow && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                This bill is outside the {settings?.return_window_days}-day
                return window.
              </span>
            </div>
          )}

          {/* Returnable items */}
          {loadingReturnable ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : returnItems.length === 0 ? (
            (() => {
              initReturnItems()
              return null
            })()
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Select items to return</h3>
              {returnItems.map((item) => (
                <Card key={item.billItemId} size="sm">
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(item.billItemId)}
                        disabled={item.returnableQuantity === 0}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {item.productName}
                          {item.size && (
                            <span className="ml-1 text-muted-foreground">
                              ({item.size})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku} &middot; Orig qty: {item.originalQuantity}
                          {item.returnedQuantity > 0 && (
                            <> &middot; Already returned: {item.returnedQuantity}</>
                          )}
                          &middot; Returnable: {item.returnableQuantity}
                        </p>
                      </div>
                      <Amount
                        value={item.unitPrice * (1 - item.catalogDiscountPct / 100)}
                        className="text-sm"
                      />
                    </div>

                    {item.selected && item.returnableQuantity > 0 && (
                      <div className="ml-7 flex flex-wrap items-center gap-4">
                        {/* Return quantity */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Qty:</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                updateReturnQty(
                                  item.billItemId,
                                  item.returnQty - 1,
                                )
                              }
                              disabled={item.returnQty <= 1}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.returnQty}
                              onChange={(e) =>
                                updateReturnQty(
                                  item.billItemId,
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              className="h-7 w-14 text-center text-sm"
                              min={1}
                              max={item.returnableQuantity}
                            />
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                updateReturnQty(
                                  item.billItemId,
                                  item.returnQty + 1,
                                )
                              }
                              disabled={item.returnQty >= item.returnableQuantity}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Reason:</Label>
                          <Select
                            value={item.reason}
                            onValueChange={(val) =>
                              updateReason(item.billItemId, val ?? 'size_issue')
                            }
                          >
                            <SelectTrigger size="sm" className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RETURN_REASONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Per-item refund */}
                        <div className="text-xs text-muted-foreground">
                          Refund:{' '}
                          <span className="font-mono font-medium text-foreground">
                            {formatIndianCurrency(
                              item.unitPrice *
                                (1 - item.catalogDiscountPct / 100) *
                                item.returnQty,
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Summary + Next */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div>
                  <p className="text-sm">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}{' '}
                    selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total refund:{' '}
                    <span className="font-mono font-medium">
                      {formatIndianCurrency(totalRefund)}
                    </span>
                  </p>
                </div>
                <Button
                  onClick={handleProceedToRefund}
                  disabled={selectedItems.length === 0}
                >
                  Next
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Refund Mode & Summary */}
      {step === 2 && selectedBill && (
        <div className="space-y-4">
          {/* Refund Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Mode</CardTitle>
              <CardDescription>How would you like to process this return?</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={refundMode}
                onValueChange={(val) =>
                  setRefundMode(val as 'cash' | 'credit_note' | 'exchange')
                }
                className="grid gap-3 sm:grid-cols-3"
              >
                <label
                  htmlFor="refund-cash"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    refundMode === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem
                    value="cash"
                    id="refund-cash"
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Cash Refund</span>
                    <p className="text-xs text-muted-foreground">
                      Refund the amount in cash
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="refund-credit"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    refundMode === 'credit_note'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem
                    value="credit_note"
                    id="refund-credit"
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Credit Note</span>
                    <p className="text-xs text-muted-foreground">
                      Issue store credit to the customer
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="refund-exchange"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    refundMode === 'exchange'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem
                    value="exchange"
                    id="refund-exchange"
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Exchange</span>
                    <p className="text-xs text-muted-foreground">
                      Replace with different products
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Exchange items (only in exchange mode) */}
          {refundMode === 'exchange' && (
            <Card>
              <CardHeader>
                <CardTitle>Exchange Items</CardTitle>
                <CardDescription>
                  Search and add the products the customer wants instead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SearchInput
                  value={exchangeSearch}
                  onChange={setExchangeSearch}
                  placeholder="Search product to exchange..."
                  className="w-full"
                />

                {exchangeSearch.length >= 2 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {loadingExchangeSearch ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : exchangeSearchResults.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No products found
                      </p>
                    ) : (
                      exchangeSearchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
                          onClick={() => handleAddExchangeItem(product)}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {product.name}
                              {product.size && (
                                <span className="ml-1 text-muted-foreground">
                                  ({product.size})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          </div>
                          <Amount
                            value={product.sellingPrice}
                            className="text-sm"
                          />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {exchangeItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {exchangeItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {item.productName}
                              {item.size && (
                                <span className="ml-1 text-muted-foreground">
                                  ({item.size})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} &times;{' '}
                              {formatIndianCurrency(item.sellingPrice)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Amount
                              value={item.sellingPrice * item.quantity}
                              className="text-sm font-medium"
                            />
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                handleRemoveExchangeItem(item.productId)
                              }
                            >
                              <Minus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="return-notes">Notes (optional)</Label>
            <Input
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Return Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Items being returned */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Items being returned
                </p>
                {selectedItems.map((item) => (
                  <div
                    key={item.billItemId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {item.productName}
                      {item.size && ` (${item.size})`} x{item.returnQty}
                    </span>
                    <Amount
                      value={
                        item.unitPrice *
                        (1 - item.catalogDiscountPct / 100) *
                        item.returnQty
                      }
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Refund Amount</span>
                  <Amount
                    value={totalRefund}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Refund Mode</span>
                  <Badge variant="outline">
                    {refundMode === 'cash'
                      ? 'Cash'
                      : refundMode === 'credit_note'
                        ? 'Credit Note'
                        : 'Exchange'}
                  </Badge>
                </div>

                {refundMode === 'exchange' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span>Exchange Items Total</span>
                      <Amount
                        value={exchangeTotal}
                        className="text-sm font-medium"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>
                        {priceDifference >= 0
                          ? 'Customer Pays'
                          : 'Refund to Customer'}
                      </span>
                      <Amount
                        value={Math.abs(priceDifference)}
                        className="text-sm font-semibold"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Process Return Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={
              returnMutation.isPending ||
              selectedItems.length === 0 ||
              !canProcessReturn
            }
            onClick={() => setConfirmOpen(true)}
          >
            {returnMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 size-4" />
                Process Return
              </>
            )}
          </Button>

          {!canProcessReturn && (
            <p className="text-center text-xs text-destructive">
              You do not have permission to process returns.
            </p>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Process Return?"
        description={`This will process a ${refundMode === 'cash' ? 'cash refund' : refundMode === 'credit_note' ? 'credit note' : 'product exchange'} of ${formatIndianCurrency(totalRefund)} for ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}.`}
        confirmLabel="Process Return"
        onConfirm={handleProcessReturn}
      />
    </div>
  )
}

// ---------- Sub-components ----------

function StepIndicator({
  label,
  active,
  done,
  index,
}: {
  label: string
  active: boolean
  done: boolean
  index: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
          done
            ? 'bg-primary text-primary-foreground'
            : active
              ? 'border-2 border-primary text-primary'
              : 'border border-muted-foreground/30 text-muted-foreground'
        }`}
      >
        {done ? <CheckCircle2 className="size-4" /> : index}
      </div>
      <span
        className={`text-xs ${
          active || done ? 'font-medium text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function BillCard({
  bill,
  onSelect,
}: {
  bill: Bill
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-medium">{bill.billNumber}</p>
        <p className="text-xs text-muted-foreground">
          {bill.customer?.name ?? 'Walk-in'} &middot;{' '}
          {formatDate(bill.createdAt)}
        </p>
      </div>
      <Amount
        value={parseFloat(bill.netAmount)}
        className="text-sm font-semibold"
      />
    </button>
  )
}
