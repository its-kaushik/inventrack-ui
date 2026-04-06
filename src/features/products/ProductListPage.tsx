import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Upload,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, EmptyState, FAB, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProducts, useCategories, useBrands } from '@/hooks/use-products';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { useAuthStore } from '@/stores/auth.store';
import { formatINR } from '@/lib/currency';

import { ProductCard } from '@/features/products/components';
import {
  ProductFilters,
  type ProductFiltersValues,
} from '@/features/products/components';

// ── Constants ──

const PAGE_LIMIT = 20;

// ── Helpers ──

function getStockStatus(stock: number) {
  if (stock === 0) return { color: 'red' as const, label: 'Out of Stock' };
  if (stock <= 5) return { color: 'amber' as const, label: 'Low Stock' };
  return { color: 'green' as const, label: 'In Stock' };
}

// ── Skeleton loaders ──

function ProductCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10">
      <Skeleton className="size-[60px] shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function ProductTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">MRP</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function ProductListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFiltersValues>({});

  const debouncedSearch = useDebounce(search, 300);

  // Derive isArchived from tab
  const isArchived = activeTab === 'archived' ? 'true' : 'false';

  // ── Data fetching ──
  const { data: productsResponse, isLoading, isError } = useProducts({
    search: debouncedSearch || undefined,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    isArchived,
    page,
    limit: PAGE_LIMIT,
  });

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const products = productsResponse?.data ?? [];
  const meta = productsResponse?.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

  // Build lookup maps for category/brand names
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const brandMap = useMemo(() => {
    const map = new Map<string, string>();
    brands.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [brands]);

  // Count active filters
  const activeFilterCount = [filters.categoryId, filters.brandId, filters.stockStatus, filters.sortBy].filter(Boolean).length;

  // Reset to page 1 when search or filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: ProductFiltersValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  // ── Empty state check ──
  const isEmpty = !isLoading && products.length === 0;
  const isSearching = !!debouncedSearch || activeFilterCount > 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader
        title="Products"
        action={
          canManage
            ? {
                label: 'Add Product',
                onClick: () => navigate('/products/new'),
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Tabs for Active / Archived */}
      <div className="px-4 desktop:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 desktop:px-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="flex-1"
        />
        <Button
          variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Main content area with optional filter sidebar */}
      <div className="flex flex-1 gap-4 px-4 pb-6 desktop:px-6">
        {/* Filters panel */}
        <ProductFilters
          filters={filters}
          onChange={handleFiltersChange}
          categories={categories}
          brands={brands}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />

        {/* Product listing */}
        <div className="flex-1">
          {isError && (
            <div className="rounded-lg bg-error-50 p-4 text-center text-sm text-error-700">
              Failed to load products. Please try again.
            </div>
          )}

          {isLoading ? (
            isMobile ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-card ring-1 ring-foreground/10">
                <ProductTableSkeleton />
              </div>
            )
          ) : isEmpty ? (
            isSearching ? (
              <EmptyState
                icon={Package}
                title="No products found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <div className="flex flex-col items-center">
                <EmptyState
                  icon={Package}
                  title="No products yet"
                  description="Add your first product to get started."
                  actionLabel={canManage ? 'Add Product' : undefined}
                  onAction={canManage ? () => navigate('/products/new') : undefined}
                />
                {canManage && (
                  <Button
                    variant="outline"
                    className="-mt-2"
                    onClick={() => navigate('/products/import')}
                  >
                    <Upload className="size-4" data-icon="inline-start" />
                    Import CSV
                  </Button>
                )}
              </div>
            )
          ) : (
            <>
              {/* Mobile: Card list */}
              <div className="flex flex-col gap-3 desktop:hidden">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      brand: product.brandId
                        ? { name: brandMap.get(product.brandId) ?? '' }
                        : undefined,
                      category: { name: categoryMap.get(product.categoryId) ?? '' },
                      totalStock: (product as any).totalStock ?? 0,
                      primaryImageUrl: (product as any).primaryImageUrl ?? null,
                      firstVariantSku: (product as any).firstVariantSku ?? null,
                    }}
                  />
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">MRP</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const brandName = product.brandId
                        ? brandMap.get(product.brandId) ?? '\u2014'
                        : '\u2014';
                      const categoryName = categoryMap.get(product.categoryId) ?? '\u2014';
                      const totalStock = (product as any).totalStock ?? 0;
                      const stockStatus = getStockStatus(totalStock);

                      return (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {product.name}
                              </span>
                              {product.isArchived && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Archived
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {brandName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {categoryName}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {product.defaultMrp ? formatINR(product.defaultMrp) : '\u2014'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {totalStock}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={stockStatus.color}
                              label={stockStatus.label}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                  >
                    <ChevronLeft className="size-4" data-icon="inline-start" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Next
                    <ChevronRight className="size-4" data-icon="inline-end" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {canManage && isMobile && (
        <FAB
          label="Add Product"
          onClick={() => navigate('/products/new')}
        />
      )}
    </div>
  );
}
