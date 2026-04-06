import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared';
import type { Product } from '@/types/models';

export interface ProductCardProps {
  product: Product & {
    brand?: { name: string };
    category?: { name: string };
    totalStock?: number;
    lowStockThreshold?: number | null;
    primaryImageUrl?: string | null;
    firstVariantSku?: string | null;
  };
}

function getStockStatus(stock: number, threshold: number | null) {
  if (stock === 0) return { color: 'red' as const, label: 'Out of Stock' };
  if (threshold != null && stock <= threshold)
    return { color: 'amber' as const, label: 'Low Stock' };
  return { color: 'green' as const, label: 'In Stock' };
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  const stock = product.totalStock ?? 0;
  const threshold = product.lowStockThreshold ?? null;
  const status = getStockStatus(stock, threshold);

  return (
    <button
      type="button"
      onClick={() => navigate(`/products/${product.id}`)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left shadow-sm ring-1 ring-foreground/10',
        'transition-colors hover:bg-muted/50 active:bg-muted',
      )}
    >
      {/* Image / Placeholder */}
      <div className="flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {product.primaryImageUrl ? (
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : (
          <Package className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {product.name}
          </span>
          {product.isArchived && (
            <Badge variant="destructive" className="shrink-0">
              Archived
            </Badge>
          )}
        </div>

        <span className="truncate text-xs text-muted-foreground">
          {[product.brand?.name, product.category?.name]
            .filter(Boolean)
            .join(' \u00B7 ') || '\u2014'}
        </span>

        <span className="text-xs text-muted-foreground">
          MRP: {product.defaultMrp ? formatINR(product.defaultMrp) : '\u2014'}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              Stock: {stock}
            </span>
            <StatusBadge status={status.color} label={status.label} />
          </div>
        </div>

        <span className="truncate text-xs text-muted-foreground">
          SKU: {product.firstVariantSku || '\u2014'}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}
