import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Pencil,
  Printer,
  History,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  ConfirmSheet,
  OfflineImagePlaceholder,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

import {
  useProduct,
  useArchiveProduct,
  useUnarchiveProduct,
} from '@/hooks/use-products';
import { useAuthStore } from '@/stores/auth.store';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';

import { VariantTable } from '@/features/products/components';

// ── Loading skeleton ──

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6" aria-busy="true">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full max-w-sm rounded-xl" />

      {/* Quick info grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-2 h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Variant table skeleton */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* Details skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  const { data: product, isLoading } = useProduct(id!);
  const archiveMutation = useArchiveProduct();
  const unarchiveMutation = useUnarchiveProduct();

  const [archiveSheetOpen, setArchiveSheetOpen] = useState(false);

  // Compute totals from variants
  const totalStock = useMemo(() => {
    if (!product?.variants) return 0;
    return product.variants.reduce((sum, v) => sum + v.availableQuantity, 0);
  }, [product?.variants]);

  const variantCount = product?.variants?.length ?? 0;

  // Find the weighted average cost across all variants (use first variant's WAC or average)
  const avgWeightedCost = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const total = product.variants.reduce(
      (sum, v) => sum + parseFloat(v.weightedAvgCost || '0'),
      0,
    );
    return total / product.variants.length;
  }, [product?.variants]);

  // Get primary image
  const primaryImage = useMemo(() => {
    if (!product?.images || product.images.length === 0) return null;
    return (
      product.images.find((img) => img.isPrimary) ?? product.images[0]
    );
  }, [product?.images]);

  // ── Handlers ──

  const handleArchiveToggle = () => {
    if (!product) return;
    if (product.isArchived) {
      unarchiveMutation.mutate(product.id, {
        onSuccess: () => setArchiveSheetOpen(false),
      });
    } else {
      archiveMutation.mutate(product.id, {
        onSuccess: () => setArchiveSheetOpen(false),
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." showBack />
        <DetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <PageHeader title="Product" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Package className="size-12 text-neutral-300" />
          <h3 className="mt-4 font-semibold text-neutral-900">
            Product not found
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            This product may have been deleted or you don't have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={product.name} showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Archived banner */}
        {product.isArchived && (
          <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700">
            <Archive className="size-4 shrink-0" aria-hidden="true" />
            This product is archived
          </div>
        )}

        {/* Image section */}
        <div className="mx-auto w-full max-w-sm">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="aspect-square w-full rounded-xl object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="aspect-square w-full overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <OfflineImagePlaceholder className="size-full" />
            </div>
          )}
        </div>

        {/* Quick info cards - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card size="sm">
            <CardContent>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {product.defaultMrp ? formatINR(product.defaultMrp) : '\u2014'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">MRP</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {avgWeightedCost != null ? formatINR(avgWeightedCost) : '\u2014'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Cost (WAC)</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {totalStock}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total Stock</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {variantCount}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Variants</p>
            </CardContent>
          </Card>
        </div>

        {/* Variant table */}
        {product.variants && product.variants.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Variants
            </h2>
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <VariantTable variants={product.variants} />
            </div>
          </section>
        )}

        {/* Product details */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Details
          </h2>
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              {product.category && (
                <>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium text-foreground">
                    {product.category.name}
                  </dd>
                </>
              )}

              {product.brand && (
                <>
                  <dt className="text-muted-foreground">Brand</dt>
                  <dd className="font-medium text-foreground">
                    {product.brand.name}
                  </dd>
                </>
              )}

              {product.hsnCode && (
                <>
                  <dt className="text-muted-foreground">HSN Code</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {product.hsnCode}
                  </dd>
                </>
              )}

              {product.gstRate != null && (
                <>
                  <dt className="text-muted-foreground">GST Rate</dt>
                  <dd className="font-medium text-foreground">
                    {product.gstRate}%
                  </dd>
                </>
              )}

              <>
                <dt className="text-muted-foreground">Product Discount</dt>
                <dd className="font-medium text-foreground">
                  {parseFloat(product.productDiscountPct) > 0
                    ? `${product.productDiscountPct}%`
                    : 'None'}
                </dd>
              </>

              {product.description && (
                <>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-medium text-foreground">
                    {product.description}
                  </dd>
                </>
              )}

              <>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium text-foreground">
                  {formatDate(product.createdAt)}
                </dd>
              </>

              <>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="font-medium text-foreground">
                  {formatDate(product.updatedAt)}
                </dd>
              </>
            </dl>
          </div>
        </section>

        {/* Action buttons */}
        <section className="flex flex-col gap-3">
          {canManage && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              <Pencil className="size-4" />
              Edit Product
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/products/${product.id}/labels`)}
          >
            <Printer className="size-4" />
            Print Labels
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/products/${product.id}/stock-history`)}
          >
            <History className="size-4" />
            View Stock History
          </Button>

          {canManage && (
            <Button
              variant={product.isArchived ? 'outline' : 'destructive'}
              className="w-full justify-start gap-2"
              onClick={() => setArchiveSheetOpen(true)}
            >
              {product.isArchived ? (
                <>
                  <ArchiveRestore className="size-4" />
                  Restore Product
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  Archive Product
                </>
              )}
            </Button>
          )}
        </section>
      </div>

      {/* Archive/Unarchive confirm sheet */}
      <ConfirmSheet
        open={archiveSheetOpen}
        onOpenChange={setArchiveSheetOpen}
        title={product.isArchived ? 'Restore Product' : 'Archive Product'}
        description={
          product.isArchived
            ? `Are you sure you want to restore "${product.name}"? It will appear in your active product list again.`
            : `Are you sure you want to archive "${product.name}"? It will be hidden from your active product list but can be restored later.`
        }
        confirmLabel={product.isArchived ? 'Restore' : 'Archive'}
        cancelLabel="Cancel"
        onConfirm={handleArchiveToggle}
        variant={product.isArchived ? 'default' : 'destructive'}
      />
    </div>
  );
}
