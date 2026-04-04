import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getProduct, deleteProduct } from '@/api/products.api'
import { listCategories, listBrands } from '@/api/categories.api'
import { useRole } from '@/hooks/use-role'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { Skeleton } from '@/components/data/loading-skeleton'
import { EmptyState } from '@/components/data/empty-state'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_app/inventory/products/$id')({
  component: ProductDetailPage,
})

function getStockVariant(
  stock: number,
  minLevel: number,
): 'success' | 'warning' | 'error' {
  if (stock <= 0) return 'error'
  if (stock <= minLevel) return 'warning'
  return 'success'
}

function getStockLabel(stock: number, minLevel: number): string {
  if (stock <= 0) return 'Out of Stock'
  if (stock <= minLevel) return 'Low Stock'
  return 'In Stock'
}

function ProductDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canManageProducts, canViewCostPrice, canDeleteProducts } = useRole()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProduct(id).then((res) => res.data),
  })

  // Fetch categories and brands for display names
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => listBrands().then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      toast.success('Product deleted.')
      navigate({ to: '/inventory/products' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete product.',
      )
    },
  })

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <Link to="/inventory/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Back to Products
          </Button>
        </Link>
        <EmptyState
          icon={Package}
          title="Product not found"
          description="The product you are looking for does not exist or has been removed."
          action={{
            label: 'Go to Products',
            onClick: () => navigate({ to: '/inventory/products' }),
          }}
        />
      </div>
    )
  }

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? '-'
  const brandName = product.brandId
    ? (brands.find((b) => b.id === product.brandId)?.name ?? '-')
    : '-'
  const stock = product.currentStock ?? 0
  const stockVariant = getStockVariant(stock, product.minStockLevel)
  const stockLabel = getStockLabel(stock, product.minStockLevel)

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/inventory/products">
            <Button variant="ghost" size="icon-sm" className="mt-1">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <Badge variant="secondary">{product.sku}</Badge>
              <StatusBadge variant={product.isActive ? 'success' : 'error'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            {product.barcode && product.barcode !== product.sku && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Barcode: {product.barcode}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canManageProducts && (
            <Link
              to="/inventory/products/new"
              search={{ edit: product.id }}
            >
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 size-3.5" />
                Edit
              </Button>
            </Link>
          )}
          {canDeleteProducts && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Product Images */}
      {product.imageUrls.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {product.imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`${product.name} image ${idx + 1}`}
              className="size-32 shrink-0 rounded-lg border object-cover"
            />
          ))}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <InfoRow label="Category" value={categoryName} />
              <InfoRow label="Sub-type" value={product.subTypeId ?? '-'} />
              <InfoRow label="Brand" value={brandName} />
              <InfoRow label="Size" value={product.size ?? '-'} />
              <InfoRow label="Color" value={product.color ?? '-'} />
            </dl>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Selling Price</dt>
                <dd>
                  <Amount value={product.sellingPrice} />
                </dd>
              </div>
              {product.mrp != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">MRP</dt>
                  <dd>
                    <Amount value={product.mrp} />
                  </dd>
                </div>
              )}
              {canViewCostPrice && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Cost Price</dt>
                  <dd>
                    <Amount value={product.costPrice} />
                  </dd>
                </div>
              )}
              <Separator />
              <InfoRow
                label="Catalog Discount"
                value={`${product.catalogDiscountPct}%`}
              />
              <InfoRow label="GST Rate" value={`${product.gstRate}%`} />
              <InfoRow label="HSN Code" value={product.hsnCode ?? '-'} />
            </dl>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Current Stock</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{stock}</span>
                  <StatusBadge variant={stockVariant}>{stockLabel}</StatusBadge>
                </dd>
              </div>
              <InfoRow
                label="Min Stock Level"
                value={String(product.minStockLevel)}
              />
              <InfoRow
                label="Reorder Point"
                value={
                  product.reorderPoint != null
                    ? String(product.reorderPoint)
                    : '-'
                }
              />
            </dl>
          </CardContent>
        </Card>

        {/* Description */}
        {product.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {product.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        destructive
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
