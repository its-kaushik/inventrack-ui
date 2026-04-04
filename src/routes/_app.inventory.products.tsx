/* eslint-disable react-refresh/only-export-components */
import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Plus, Package } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listProducts } from '@/api/products.api'
import type { ProductFilters } from '@/api/products.api'
import { listCategories, listBrands } from '@/api/categories.api'
import type { Product } from '@/types/models'
import { useRole } from '@/hooks/use-role'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { SearchInput } from '@/components/form/search-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/inventory/products')({
  component: ProductListPage,
})

const PAGE_SIZE = 25

type StockFilter = 'all' | 'in_stock' | 'low' | 'out'

function getStockVariant(product: Product): 'success' | 'warning' | 'error' {
  const stock = product.currentStock ?? 0
  if (stock <= 0) return 'error'
  if (stock <= product.minStockLevel) return 'warning'
  return 'success'
}

function getStockLabel(product: Product): string {
  const stock = product.currentStock ?? 0
  if (stock <= 0) return 'Out of Stock'
  if (stock <= product.minStockLevel) return `Low (${stock})`
  return `In Stock (${stock})`
}

function ProductListPage() {
  const navigate = useNavigate()
  const { canManageProducts } = useRole()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')

  // Fetch categories and brands for filter dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => listCategories().then((res) => res.data),
  })

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => listBrands().then((res) => res.data),
  })

  const filters: ProductFilters = useMemo(
    () => ({
      search: search || undefined,
      category_id: categoryId || undefined,
      brand_id: brandId || undefined,
      limit: PAGE_SIZE,
    }),
    [search, categoryId, brandId],
  )

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.products.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam = 0 }) =>
      listProducts({ ...filters, offset: pageParam }).then((res) => ({
        items: Array.isArray(res.data) ? res.data : [],
        hasMore: res.meta?.has_more ?? false,
      })),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + PAGE_SIZE : undefined,
  })

  const allProducts = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page?.items ?? (Array.isArray(page) ? page : []))
        .filter(Boolean) ?? [],
    [data],
  )

  // Client-side stock filter
  const filteredProducts = useMemo(() => {
    if (stockFilter === 'all') return allProducts
    return allProducts.filter((p) => {
      const stock = p.currentStock ?? 0
      if (stockFilter === 'out') return stock <= 0
      if (stockFilter === 'low') return stock > 0 && stock <= p.minStockLevel
      if (stockFilter === 'in_stock') return stock > p.minStockLevel
      return true
    })
  }, [allProducts, stockFilter])

  const handleRowClick = useCallback(
    (product: Product) => {
      navigate({ to: '/inventory/products/$id', params: { id: product.id } })
    },
    [navigate],
  )

  // Look up category name
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.name)
    return m
  }, [categories])

  // Look up brand name
  const brandMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const b of brands) m.set(b.id, b.name)
    return m
  }, [brands])

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (p) => (
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.sku}</p>
          </div>
        ),
      },
      {
        key: 'sku',
        header: 'SKU',
        hideOnMobile: true,
        render: (p) => <span className="font-mono text-xs">{p.sku}</span>,
      },
      {
        key: 'category',
        header: 'Category',
        hideOnMobile: true,
        render: (p) => categoryMap.get(p.categoryId) ?? '-',
      },
      {
        key: 'brand',
        header: 'Brand',
        hideOnMobile: true,
        render: (p) => (p.brandId ? (brandMap.get(p.brandId) ?? '-') : '-'),
      },
      {
        key: 'size',
        header: 'Size',
        hideOnMobile: true,
        render: (p) => p.size ?? '-',
      },
      {
        key: 'sellingPrice',
        header: 'Price',
        sortable: true,
        className: 'text-right',
        render: (p) => <Amount value={p.sellingPrice} />,
      },
      {
        key: 'stock',
        header: 'Stock',
        sortable: true,
        render: (p) => <StatusBadge variant={getStockVariant(p)}>{getStockLabel(p)}</StatusBadge>,
      },
      {
        key: 'actions',
        header: '',
        render: (p) => (
          <Link
            to="/inventory/products/$id"
            params={{ id: p.id }}
            className="text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        ),
      },
    ],
    [categoryMap, brandMap],
  )

  const mobileCard = useCallback(
    (product: Product) => (
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Amount value={product.sellingPrice} className="text-sm" />
              <StatusBadge variant={getStockVariant(product)}>{getStockLabel(product)}</StatusBadge>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  )

  const isEmpty = !isLoading && filteredProducts.length === 0 && !search && !categoryId && !brandId

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        {canManageProducts && (
          <Link to="/inventory/products/new">
            <Button>
              <Plus className="mr-1 size-4" />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryId}
            onValueChange={(val) => setCategoryId(val === '__all__' ? '' : (val ?? ''))}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brandId}
            onValueChange={(val) => setBrandId(val === '__all__' ? '' : (val ?? ''))}
          >
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stockFilter}
            onValueChange={(val) => setStockFilter((val ?? 'all') as StockFilter)}
          >
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table / Empty State */}
      {isEmpty ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to get started."
          action={
            canManageProducts
              ? {
                  label: 'Add Product',
                  onClick: () => navigate({ to: '/inventory/products/new' }),
                }
              : undefined
          }
        />
      ) : (
        <>
          <DataTable<Product>
            data={filteredProducts}
            columns={columns}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyMessage="No products match your filters"
            mobileCard={mobileCard}
          />

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
