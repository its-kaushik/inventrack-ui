import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Upload, Search } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { createPurchase } from '@/api/purchases.api'
import { listSuppliers } from '@/api/suppliers.api'
import { searchProducts } from '@/api/products.api'
import type { Product, Supplier } from '@/types/models'
import { useDebounce } from '@/hooks/use-debounce'
import { formatIndianCurrency } from '@/lib/format-currency'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/purchases/receive')({
  component: GoodsReceiptPage,
})

// ---------- Schema ----------

const lineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(), // display only
  quantity: z.number().int().positive('Qty must be > 0'),
  costPrice: z.number().positive('Cost must be > 0'),
  gstRate: z.number().min(0).max(100),
})

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  cgstAmount: z.number().min(0).optional(),
  sgstAmount: z.number().min(0).optional(),
  igstAmount: z.number().min(0).optional(),
  isRcm: z.boolean().optional(),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>

const emptyLineItem = {
  productId: '',
  productName: '',
  quantity: 1,
  costPrice: 0,
  gstRate: 0,
}

// ---------- Product Search Combobox ----------

function ProductSearchSelect({
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
        <div className="flex items-center gap-1">
          <span className="flex-1 truncate text-sm">{productName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              onSelect({
                id: '',
                name: '',
                gstRate: 0,
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
            placeholder="Search product..."
            className="h-8 text-sm"
          />
          {open && results.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-md">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect(product)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku}
                      {product.size ? ` | ${product.size}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    GST {product.gstRate}%
                  </span>
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

// ---------- Supplier Search Select ----------

function SupplierSelect({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (val: string) => void
  error?: string
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: suppliers = [] } = useQuery({
    queryKey: queryKeys.suppliers.list({ search: debouncedSearch }),
    queryFn: () =>
      listSuppliers(debouncedSearch || undefined).then((res) => res.data),
  })

  return (
    <div className="space-y-1.5">
      <Label>Supplier *</Label>
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Type to search suppliers..."
        className="mb-1"
      />
      <Select
        value={value}
        onValueChange={(val) => onChange(val ?? '')}
      >
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder="Select supplier" />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((s: Supplier) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
              {s.gstin ? ` (${s.gstin})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ---------- Page ----------

function GoodsReceiptPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      invoiceNumber: '',
      invoiceDate: '',
      items: [{ ...emptyLineItem }],
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      isRcm: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')
  const watchedIsRcm = watch('isRcm')

  // Calculate line item totals
  function lineGstAmount(index: number) {
    const item = watchedItems[index]
    if (!item) return 0
    return (item.costPrice * item.quantity * item.gstRate) / 100
  }

  function lineTotal(index: number) {
    const item = watchedItems[index]
    if (!item) return 0
    return item.costPrice * item.quantity + lineGstAmount(index)
  }

  function grandTotal() {
    return watchedItems.reduce((sum, _, i) => sum + lineTotal(i), 0)
  }

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: PurchaseFormValues) => {
      const totalAmount = data.items.reduce((sum, item) => {
        const lineBase = item.costPrice * item.quantity
        const lineGst = (lineBase * item.gstRate) / 100
        return sum + lineBase + lineGst
      }, 0)
      return createPurchase({
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber || null,
        invoiceDate: data.invoiceDate || null,
        invoiceImageUrl: null,
        totalAmount,
        cgstAmount: data.cgstAmount ?? 0,
        sgstAmount: data.sgstAmount ?? 0,
        igstAmount: data.igstAmount ?? 0,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          gstRate: item.gstRate,
        })),
        isRcm: data.isRcm ?? false,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() })
      toast.success('Purchase recorded successfully.')
      navigate({ to: '/purchases/history' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to record purchase.',
      )
    },
  })

  function onSubmit(data: PurchaseFormValues) {
    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Goods Receipt</h1>
        <p className="text-sm text-muted-foreground">
          Record incoming goods from a supplier.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-4xl space-y-6"
      >
        {/* Supplier & Invoice Info */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Supplier & Invoice
          </legend>

          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <SupplierSelect
                value={field.value}
                onChange={field.onChange}
                error={errors.supplierId?.message}
              />
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="e.g. INV-2024-001"
                {...register('invoiceNumber')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                {...register('invoiceDate')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Invoice Image</Label>
            <Button type="button" variant="outline" size="sm" disabled>
              <Upload className="mr-1 size-3.5" />
              Upload Image (coming soon)
            </Button>
          </div>
        </fieldset>

        {/* Line Items */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Line Items</legend>

          {errors.items?.message && (
            <p className="text-xs text-destructive">{errors.items.message}</p>
          )}

          {/* Desktop header row */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_0.8fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground lg:grid">
            <span>Product</span>
            <span>Qty</span>
            <span>Cost Price</span>
            <span>GST %</span>
            <span>GST Amt</span>
            <span>Line Total</span>
            <span className="w-8" />
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 lg:space-y-0">
              {/* Desktop row */}
              <div className="hidden grid-cols-[2fr_1fr_1fr_0.8fr_1fr_1fr_auto] items-start gap-2 lg:grid">
                {/* Product */}
                <Controller
                  control={control}
                  name={`items.${index}.productId`}
                  render={({ field: f }) => (
                    <div>
                      <ProductSearchSelect
                        value={f.value}
                        productName={watchedItems[index]?.productName ?? ''}
                        onSelect={(product) => {
                          setValue(`items.${index}.productId`, product.id)
                          setValue(`items.${index}.productName`, product.name)
                          if (product.gstRate) {
                            setValue(`items.${index}.gstRate`, product.gstRate)
                          }
                          if (product.costPrice && !watchedItems[index]?.costPrice) {
                            setValue(
                              `items.${index}.costPrice`,
                              product.costPrice,
                            )
                          }
                        }}
                      />
                      {errors.items?.[index]?.productId && (
                        <p className="mt-0.5 text-xs text-destructive">
                          {errors.items[index].productId?.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Quantity */}
                <div>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-sm"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors.items[index].quantity?.message}
                    </p>
                  )}
                </div>

                {/* Cost Price */}
                <Controller
                  control={control}
                  name={`items.${index}.costPrice`}
                  render={({ field: f }) => (
                    <div>
                      <CurrencyInput
                        value={f.value}
                        onChange={f.onChange}
                        placeholder="0"
                      />
                      {errors.items?.[index]?.costPrice && (
                        <p className="mt-0.5 text-xs text-destructive">
                          {errors.items[index].costPrice?.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* GST Rate */}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-8 text-sm"
                  {...register(`items.${index}.gstRate`, {
                    valueAsNumber: true,
                  })}
                />

                {/* GST Amount (calculated) */}
                <span className="flex h-8 items-center font-mono text-sm tabular-nums text-muted-foreground">
                  {formatIndianCurrency(lineGstAmount(index))}
                </span>

                {/* Line Total (calculated) */}
                <span className="flex h-8 items-center font-mono text-sm font-medium tabular-nums">
                  {formatIndianCurrency(lineTotal(index))}
                </span>

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              {/* Mobile card layout */}
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3 lg:hidden">
                <div className="space-y-1.5">
                  <Label className="text-xs">Product</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.productId`}
                    render={({ field: f }) => (
                      <ProductSearchSelect
                        value={f.value}
                        productName={watchedItems[index]?.productName ?? ''}
                        onSelect={(product) => {
                          setValue(`items.${index}.productId`, product.id)
                          setValue(`items.${index}.productName`, product.name)
                          if (product.gstRate) {
                            setValue(`items.${index}.gstRate`, product.gstRate)
                          }
                          if (product.costPrice && !watchedItems[index]?.costPrice) {
                            setValue(
                              `items.${index}.costPrice`,
                              product.costPrice,
                            )
                          }
                        }}
                      />
                    )}
                  />
                  {errors.items?.[index]?.productId && (
                    <p className="text-xs text-destructive">
                      {errors.items[index].productId?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 text-sm"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Price</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.costPrice`}
                      render={({ field: f }) => (
                        <CurrencyInput
                          value={f.value}
                          onChange={f.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">GST %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="h-8 text-sm"
                      {...register(`items.${index}.gstRate`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    GST: {formatIndianCurrency(lineGstAmount(index))} | Total:{' '}
                    <span className="font-medium text-foreground">
                      {formatIndianCurrency(lineTotal(index))}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...emptyLineItem })}
          >
            <Plus className="mr-1 size-3.5" />
            Add Line Item
          </Button>
        </fieldset>

        {/* Totals */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Totals</legend>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Subtotal ({watchedItems.length} item
              {watchedItems.length !== 1 ? 's' : ''})
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatIndianCurrency(
                watchedItems.reduce(
                  (sum, item) => sum + (item.costPrice ?? 0) * (item.quantity ?? 0),
                  0,
                ),
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total GST</span>
            <span className="font-mono text-sm tabular-nums">
              {formatIndianCurrency(
                watchedItems.reduce((sum, _, i) => sum + lineGstAmount(i), 0),
              )}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Grand Total</span>
            <span className="font-mono text-base font-bold tabular-nums">
              {formatIndianCurrency(grandTotal())}
            </span>
          </div>
        </fieldset>

        {/* Tax Summary */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Tax Summary (ITC)
          </legend>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>CGST Amount</Label>
              <Controller
                control={control}
                name="cgstAmount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>SGST Amount</Label>
              <Controller
                control={control}
                name="sgstAmount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>IGST Amount</Label>
              <Controller
                control={control}
                name="igstAmount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isRcm"
              render={({ field }) => (
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <Label className="cursor-pointer">
              Reverse Charge Mechanism (RCM)
            </Label>
            {watchedIsRcm && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                RCM Applicable
              </span>
            )}
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-1 size-4 animate-spin" />
            )}
            Record Purchase
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/purchases/history' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
