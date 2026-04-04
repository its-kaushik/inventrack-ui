import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Search } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { createPurchaseOrder } from '@/api/purchase-orders.api'
import { listSuppliers } from '@/api/suppliers.api'
import { searchProducts } from '@/api/products.api'
import type { Product, Supplier } from '@/types/models'
import { useDebounce } from '@/hooks/use-debounce'
import { formatIndianCurrency } from '@/lib/format-currency'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/purchases/orders/new')({
  component: PurchaseOrderCreatePage,
})

// ---------- Schema ----------

const poLineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  quantity: z.number().int().positive('Qty must be > 0'),
  expectedCostPrice: z.number().positive('Cost must be > 0'),
})

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(poLineItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().optional(),
})

type POFormValues = z.infer<typeof purchaseOrderSchema>

const emptyLineItem = {
  productId: '',
  productName: '',
  quantity: 1,
  expectedCostPrice: 0,
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

// ---------- Supplier Select ----------

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
      <Select value={value} onValueChange={(val) => onChange(val ?? '')}>
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

function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<POFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      items: [{ ...emptyLineItem }],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')

  function lineTotal(index: number) {
    const item = watchedItems[index]
    if (!item) return 0
    return (item.expectedCostPrice ?? 0) * (item.quantity ?? 0)
  }

  function grandTotal() {
    return watchedItems.reduce((sum, _, i) => sum + lineTotal(i), 0)
  }

  // Mutation
  const mutation = useMutation({
    mutationFn: (data: POFormValues & { status: string }) =>
      createPurchaseOrder({
        supplierId: data.supplierId,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          expectedCostPrice: item.expectedCostPrice,
        })),
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.all(),
      })
      toast.success('Purchase order created successfully.')
      navigate({ to: '/purchases/orders' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create purchase order.',
      )
    },
  })

  function onSubmit(data: POFormValues, status: string) {
    mutation.mutate({ ...data, status })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Create Purchase Order</h1>
        <p className="text-sm text-muted-foreground">
          Create a new purchase order for a supplier.
        </p>
      </div>

      <form className="max-w-4xl space-y-6">
        {/* Supplier */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Supplier</legend>
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
        </fieldset>

        {/* Line Items */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Line Items</legend>

          {errors.items?.message && (
            <p className="text-xs text-destructive">{errors.items.message}</p>
          )}

          {/* Desktop header row */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground lg:grid">
            <span>Product</span>
            <span>Qty</span>
            <span>Expected Cost Price</span>
            <span>Line Total</span>
            <span className="w-8" />
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 lg:space-y-0">
              {/* Desktop row */}
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-start gap-2 lg:grid">
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
                          if (
                            product.costPrice &&
                            !watchedItems[index]?.expectedCostPrice
                          ) {
                            setValue(
                              `items.${index}.expectedCostPrice`,
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

                {/* Expected Cost Price */}
                <Controller
                  control={control}
                  name={`items.${index}.expectedCostPrice`}
                  render={({ field: f }) => (
                    <div>
                      <CurrencyInput
                        value={f.value}
                        onChange={f.onChange}
                        placeholder="0"
                      />
                      {errors.items?.[index]?.expectedCostPrice && (
                        <p className="mt-0.5 text-xs text-destructive">
                          {errors.items[index].expectedCostPrice?.message}
                        </p>
                      )}
                    </div>
                  )}
                />

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
                          if (
                            product.costPrice &&
                            !watchedItems[index]?.expectedCostPrice
                          ) {
                            setValue(
                              `items.${index}.expectedCostPrice`,
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

                <div className="grid grid-cols-2 gap-2">
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
                    <Label className="text-xs">Expected Cost</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.expectedCostPrice`}
                      render={({ field: f }) => (
                        <CurrencyInput
                          value={f.value}
                          onChange={f.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Total:{' '}
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

        {/* Notes */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Notes</legend>
          <Textarea
            placeholder="Any notes for this purchase order..."
            {...register('notes')}
          />
        </fieldset>

        {/* Total */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Total</legend>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Subtotal ({watchedItems.length} item
              {watchedItems.length !== 1 ? 's' : ''})
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatIndianCurrency(grandTotal())}
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

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
          >
            {mutation.isPending && (
              <Loader2 className="mr-1 size-4 animate-spin" />
            )}
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={handleSubmit((data) => onSubmit(data, 'sent'))}
          >
            {mutation.isPending && (
              <Loader2 className="mr-1 size-4 animate-spin" />
            )}
            Send to Supplier
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/purchases/orders' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
