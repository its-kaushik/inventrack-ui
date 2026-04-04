import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import { listPurchases } from '@/api/purchases.api'
import { getPurchase } from '@/api/purchases.api'
import { listSuppliers } from '@/api/suppliers.api'
import { createPurchaseReturn } from '@/api/purchase-returns.api'
import type { Purchase, Supplier } from '@/types/models'
import { useDebounce } from '@/hooks/use-debounce'
import { formatIndianCurrency } from '@/lib/format-currency'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { Skeleton } from '@/components/data/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/purchases/returns')({
  component: PurchaseReturnPage,
})

// ---------- Schema ----------

const returnItemSchema = z.object({
  productId: z.string().min(1),
  selected: z.boolean(),
  quantity: z.number().int().min(0),
  maxQuantity: z.number(),
  costPrice: z.number(),
  reason: z.string().min(1, 'Reason is required'),
  productName: z.string(),
})

const purchaseReturnSchema = z.object({
  purchaseId: z.string().min(1, 'Select a purchase'),
  items: z.array(returnItemSchema),
})

type ReturnFormValues = z.infer<typeof purchaseReturnSchema>

const RETURN_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'excess', label: 'Excess' },
]

// ---------- Page ----------

function PurchaseReturnPage() {
  const queryClient = useQueryClient()
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<
    string | undefined
  >(undefined)
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300)

  // Suppliers list
  const { data: suppliersData } = useQuery({
    queryKey: queryKeys.suppliers.list({ search: debouncedSupplierSearch }),
    queryFn: () =>
      listSuppliers(debouncedSupplierSearch || undefined).then(
        (res) => res.data,
      ),
  })
  const suppliers = suppliersData ?? []

  // Recent purchases for the selected supplier
  const purchaseFilters = useMemo(
    () => ({
      supplier_id: supplierId,
      limit: 20,
      offset: 0,
    }),
    [supplierId],
  )

  const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: queryKeys.purchases.list(
      purchaseFilters as unknown as Record<string, unknown>,
    ),
    queryFn: () => listPurchases(purchaseFilters).then((res) => res.data),
    enabled: !!supplierId,
  })

  const purchases = purchasesData?.items ?? []

  // Load full purchase detail when selected
  const { data: purchaseDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: queryKeys.purchases.detail(selectedPurchaseId ?? ''),
    queryFn: () =>
      getPurchase(selectedPurchaseId!).then((res) => res.data),
    enabled: !!selectedPurchaseId,
  })

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(purchaseReturnSchema),
    defaultValues: {
      purchaseId: '',
      items: [],
    },
  })

  const watchedItems = watch('items')

  // When purchase detail loads, populate items
  function handlePurchaseSelect(purchaseId: string) {
    setSelectedPurchaseId(purchaseId)
    const purchase = purchases.find((p) => p.id === purchaseId)

    // We need to wait for detail to load - set the purchaseId
    setValue('purchaseId', purchaseId)

    // If we already have items on the purchase object from the list, use them
    if (purchase?.items && purchase.items.length > 0) {
      setValue(
        'items',
        purchase.items.map((item) => ({
          productId: item.productId,
          selected: false,
          quantity: 0,
          maxQuantity: item.quantity,
          costPrice: parseFloat(item.costPrice),
          reason: 'damaged',
          productName: item.productId,
        })),
      )
    }
  }

  // Update items when detail loads with full product info
  const detailItems = purchaseDetail?.items
  if (
    detailItems &&
    detailItems.length > 0 &&
    watchedItems.length > 0 &&
    watchedItems[0]?.productName === watchedItems[0]?.productId
  ) {
    // Update with real names once detail loads
    detailItems.forEach((item, index) => {
      if (index < watchedItems.length) {
        setValue(`items.${index}.productName`, item.productId)
        setValue(`items.${index}.costPrice`, parseFloat(item.costPrice))
        setValue(`items.${index}.maxQuantity`, item.quantity)
      }
    })
  }

  // Calculate total return
  const totalReturnAmount = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      if (item.selected && item.quantity > 0) {
        return sum + item.quantity * item.costPrice
      }
      return sum
    }, 0)
  }, [watchedItems])

  const selectedCount = watchedItems.filter(
    (item) => item.selected && item.quantity > 0,
  ).length

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: ReturnFormValues) => {
      const returnItems = data.items
        .filter((item) => item.selected && item.quantity > 0)
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          reason: item.reason,
        }))

      return createPurchaseReturn({
        purchaseId: data.purchaseId,
        items: returnItems,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseReturns.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.all(),
      })
      toast.success('Purchase return submitted successfully.')
      reset()
      setSelectedPurchaseId(undefined)
      setSupplierId(undefined)
      setSupplierSearch('')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit purchase return.',
      )
    },
  })

  function onSubmit(data: ReturnFormValues) {
    const hasSelected = data.items.some(
      (item) => item.selected && item.quantity > 0,
    )
    if (!hasSelected) {
      toast.error('Select at least one item to return.')
      return
    }
    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Purchase Return</h1>
        <p className="text-sm text-muted-foreground">
          Return goods to a supplier from a previous purchase.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-4xl space-y-6"
      >
        {/* Select Purchase */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Select Original Purchase
          </legend>

          <div className="space-y-1.5">
            <Label>Search by Supplier</Label>
            <Input
              type="text"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Type to search suppliers..."
              className="mb-1"
            />
            <Select
              value={supplierId ?? '__none__'}
              onValueChange={(val) => {
                const newVal = !val || val === '__none__' ? undefined : val
                setSupplierId(newVal)
                setSelectedPurchaseId(undefined)
                setValue('purchaseId', '')
                setValue('items', [])
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select supplier...</SelectItem>
                {suppliers.map((s: Supplier) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supplierId && (
            <div className="space-y-1.5">
              <Label>Select Purchase</Label>
              {isLoadingPurchases ? (
                <Skeleton className="h-10 w-full" />
              ) : purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No purchases found for this supplier.
                </p>
              ) : (
                <Select
                  value={selectedPurchaseId ?? '__none__'}
                  onValueChange={(val) => {
                    if (val && val !== '__none__') {
                      handlePurchaseSelect(val)
                    }
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!errors.purchaseId}
                  >
                    <SelectValue placeholder="Select a purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      Select a purchase...
                    </SelectItem>
                    {purchases.map((p: Purchase) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.invoiceNumber ?? 'No Invoice'} -{' '}
                        {format(
                          new Date(p.invoiceDate ?? p.createdAt),
                          'dd MMM yyyy',
                        )}{' '}
                        - {formatIndianCurrency(parseFloat(p.totalAmount))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.purchaseId && (
                <p className="text-xs text-destructive">
                  {errors.purchaseId.message}
                </p>
              )}
            </div>
          )}
        </fieldset>

        {/* Line Items for return */}
        {selectedPurchaseId && watchedItems.length > 0 && (
          <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">
              Items to Return
            </legend>

            {isLoadingDetail ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {watchedItems.map((item, index) => (
                  <div
                    key={item.productId}
                    className="rounded-lg border p-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Controller
                        control={control}
                        name={`items.${index}.selected`}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                            className="mt-1"
                          />
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Original qty: {item.maxQuantity} | Cost:{' '}
                          {formatIndianCurrency(item.costPrice)}
                        </p>
                      </div>
                    </div>

                    {watchedItems[index]?.selected && (
                      <div className="ml-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Return Qty</Label>
                          <Controller
                            control={control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min={0}
                                max={item.maxQuantity}
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    Math.min(
                                      parseInt(e.target.value) || 0,
                                      item.maxQuantity,
                                    ),
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reason</Label>
                          <Controller
                            control={control}
                            name={`items.${index}.reason`}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="h-8 text-sm">
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
                            )}
                          />
                        </div>
                        <div className="flex items-end">
                          <Amount
                            value={
                              (watchedItems[index]?.quantity ?? 0) *
                              item.costPrice
                            }
                            className="text-sm font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {/* Summary */}
        {selectedPurchaseId && selectedCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Return Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Items to return
                  </span>
                  <span className="tabular-nums">{selectedCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-base font-semibold">
                    Total Return Amount
                  </span>
                  <Amount
                    value={totalReturnAmount}
                    className="text-base font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {selectedPurchaseId && (
          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-1 size-4 animate-spin" />
              )}
              Submit Return
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setSelectedPurchaseId(undefined)
                setSupplierId(undefined)
                setSupplierSearch('')
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!supplierId && (
          <EmptyState
            icon={RotateCcw}
            title="Select a supplier to begin"
            description="Choose a supplier and purchase to process a return."
          />
        )}
      </form>
    </div>
  )
}
