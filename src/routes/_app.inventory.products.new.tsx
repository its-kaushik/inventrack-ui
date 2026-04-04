import { useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import {
  getProduct,
  createProduct,
  updateProduct,
} from '@/api/products.api'
import {
  listCategories,
  listSubTypes,
  listBrands,
  listSizeSystems,
} from '@/api/categories.api'
import { useRole } from '@/hooks/use-role'
import { CurrencyInput } from '@/components/form/currency-input'
import { Skeleton } from '@/components/data/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface ProductSearchParams {
  edit?: string
}

export const Route = createFileRoute('/_app/inventory/products/new')({
  component: ProductFormPage,
  validateSearch: (search: Record<string, unknown>): ProductSearchParams => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
  }),
})

// ---------- Schema ----------

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU max 50 chars'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subTypeId: z.string().optional(),
  brandId: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().min(0, 'Min 0').max(100, 'Max 100'),
  sellingPrice: z.number().positive('Must be > 0'),
  costPrice: z.number().min(0, 'Min 0').optional(),
  mrp: z.number().min(0, 'Min 0').optional(),
  catalogDiscountPct: z.number().min(0, 'Min 0').max(100, 'Max 100').optional(),
  minStockLevel: z.number().min(0, 'Min 0').optional(),
  description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

const defaultValues: ProductFormValues = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  subTypeId: '',
  brandId: '',
  size: '',
  color: '',
  hsnCode: '',
  gstRate: 5,
  sellingPrice: 0,
  costPrice: 0,
  mrp: 0,
  catalogDiscountPct: 0,
  minStockLevel: 10,
  description: '',
}

// ---------- Page ----------

function ProductFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canViewCostPrice } = useRole()
  const { edit: editId } = Route.useSearch()
  const isEditMode = !!editId

  // Load existing product if editing
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: queryKeys.products.detail(editId ?? ''),
    queryFn: () => getProduct(editId!).then((res) => res.data),
    enabled: isEditMode,
  })

  // Load categories, brands, size systems
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => listBrands().then((res) => res.data),
  })

  const { data: sizeSystems = [] } = useQuery({
    queryKey: queryKeys.sizeSystems.all(),
    queryFn: () => listSizeSystems().then((res) => res.data),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  const selectedCategoryId = watch('categoryId')
  const selectedBrandId = watch('brandId')

  // Load sub-types based on selected category
  const { data: subTypes = [] } = useQuery({
    queryKey: queryKeys.categories.subTypes(selectedCategoryId || ''),
    queryFn: () =>
      listSubTypes(selectedCategoryId).then((res) => res.data),
    enabled: !!selectedCategoryId,
  })

  // Determine size values based on category (simple heuristic: use the first size system)
  // In a real app, categories might be linked to size systems
  const sizeValues = useMemo(() => {
    if (sizeSystems.length > 0) return sizeSystems[0].values
    return []
  }, [sizeSystems])

  // Populate form when editing
  useEffect(() => {
    if (existingProduct) {
      reset({
        name: existingProduct.name,
        sku: existingProduct.sku,
        barcode: existingProduct.barcode || '',
        categoryId: existingProduct.categoryId,
        subTypeId: existingProduct.subTypeId ?? '',
        brandId: existingProduct.brandId ?? '',
        size: existingProduct.size ?? '',
        color: existingProduct.color ?? '',
        hsnCode: existingProduct.hsnCode ?? '',
        gstRate: existingProduct.gstRate,
        sellingPrice: existingProduct.sellingPrice,
        costPrice: existingProduct.costPrice,
        mrp: existingProduct.mrp ?? 0,
        catalogDiscountPct: existingProduct.catalogDiscountPct,
        minStockLevel: existingProduct.minStockLevel,
        description: existingProduct.description ?? '',
      })
    }
  }, [existingProduct, reset])

  // Auto-generate SKU suggestion when category or brand changes (only in create mode)
  useEffect(() => {
    if (isEditMode) return
    const catCode =
      categories.find((c) => c.id === selectedCategoryId)?.code ?? ''
    const brandCode =
      brands.find((b) => b.id === selectedBrandId)?.code ?? ''
    if (catCode) {
      const suggestion = [catCode, brandCode]
        .filter(Boolean)
        .join('-')
        .toUpperCase()
      setValue('sku', suggestion + '-', { shouldValidate: false })
    }
  }, [selectedCategoryId, selectedBrandId, categories, brands, isEditMode, setValue])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductFormValues) =>
      createProduct({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId,
        subTypeId: data.subTypeId || null,
        brandId: data.brandId || null,
        size: data.size || null,
        color: data.color || null,
        hsnCode: data.hsnCode || null,
        gstRate: data.gstRate,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? 0,
        mrp: data.mrp || null,
        catalogDiscountPct: data.catalogDiscountPct ?? 0,
        minStockLevel: data.minStockLevel ?? 10,
        description: data.description || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      toast.success('Product created.')
      navigate({ to: '/inventory/products/$id', params: { id: res.data.id } })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create product.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormValues) =>
      updateProduct(editId!, {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId,
        subTypeId: data.subTypeId || null,
        brandId: data.brandId || null,
        size: data.size || null,
        color: data.color || null,
        hsnCode: data.hsnCode || null,
        gstRate: data.gstRate,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice ?? 0,
        mrp: data.mrp || null,
        catalogDiscountPct: data.catalogDiscountPct ?? 0,
        minStockLevel: data.minStockLevel ?? 10,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(editId!),
      })
      toast.success('Product updated.')
      navigate({ to: '/inventory/products/$id', params: { id: editId! } })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update product.',
      )
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(data: ProductFormValues) {
    if (isEditMode) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (isEditMode && isLoadingProduct) {
    return <FormSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/inventory/products">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? 'Update the product details below.'
              : 'Fill in the product details to add it to your catalog.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        {/* Basic Info */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Basic Information
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Nike Air Max 90"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                placeholder="e.g. FW-NK-42"
                aria-invalid={!!errors.sku}
                {...register('sku')}
              />
              {errors.sku && (
                <p className="text-xs text-destructive">
                  {errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                placeholder="Defaults to SKU if empty"
                {...register('barcode')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional product description..."
              {...register('description')}
            />
          </div>
        </fieldset>

        {/* Classification */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Classification</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val ?? '')
                      // Reset sub-type when category changes
                      setValue('subTypeId', '')
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.categoryId}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Sub-type</Label>
              <Controller
                control={control}
                name="subTypeId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? '')}
                    disabled={!selectedCategoryId || subTypes.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !selectedCategoryId
                            ? 'Select a category first'
                            : 'Select sub-type'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {subTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? '')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Size</Label>
              {sizeValues.length > 0 ? (
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val ?? '')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {sizeValues.map((sv) => (
                          <SelectItem key={sv} value={sv}>
                            {sv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <Input
                  placeholder="e.g. 42, XL, Free Size"
                  {...register('size')}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g. Black, Red"
                {...register('color')}
              />
            </div>
          </div>
        </fieldset>

        {/* Pricing & Tax */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Pricing & Tax</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Selling Price *</Label>
              <Controller
                control={control}
                name="sellingPrice"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-destructive">
                  {errors.sellingPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>MRP</Label>
              <Controller
                control={control}
                name="mrp"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
            </div>

            {canViewCostPrice && (
              <div className="space-y-1.5">
                <Label>Cost Price</Label>
                <Controller
                  control={control}
                  name="costPrice"
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="catalogDiscountPct">Catalog Discount %</Label>
              <Input
                id="catalogDiscountPct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                aria-invalid={!!errors.catalogDiscountPct}
                {...register('catalogDiscountPct', { valueAsNumber: true })}
              />
              {errors.catalogDiscountPct && (
                <p className="text-xs text-destructive">
                  {errors.catalogDiscountPct.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstRate">GST Rate (%)</Label>
              <Input
                id="gstRate"
                type="number"
                min={0}
                max={100}
                step={0.1}
                aria-invalid={!!errors.gstRate}
                {...register('gstRate', { valueAsNumber: true })}
              />
              {errors.gstRate && (
                <p className="text-xs text-destructive">
                  {errors.gstRate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                placeholder="e.g. 6402"
                {...register('hsnCode')}
              />
            </div>
          </div>
        </fieldset>

        {/* Inventory */}
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">Inventory</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                min={0}
                {...register('minStockLevel', { valueAsNumber: true })}
              />
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {isEditMode ? 'Update Product' : 'Create Product'}
          </Button>
          <Link to="/inventory/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="max-w-2xl space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
