import { useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-media-query';
import type { Category, Brand } from '@/types/models';

export interface ProductFiltersValues {
  categoryId?: string;
  brandId?: string;
  stockStatus?: string;
  sortBy?: string;
}

export interface ProductFiltersProps {
  filters: ProductFiltersValues;
  onChange: (filters: ProductFiltersValues) => void;
  categories: Category[];
  brands: Brand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STOCK_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
] as const;

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A\u2013Z' },
  { value: 'name_desc', label: 'Name Z\u2013A' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'price_asc', label: 'Price Low\u2013High' },
  { value: 'price_desc', label: 'Price High\u2013Low' },
] as const;

function FilterFields({
  filters,
  onChange,
  categories,
  brands,
}: Omit<ProductFiltersProps, 'open' | 'onOpenChange'>) {
  const update = useCallback(
    (patch: Partial<ProductFiltersValues>) => {
      onChange({ ...filters, ...patch });
    },
    [filters, onChange],
  );

  const clearAll = useCallback(() => {
    onChange({});
  }, [onChange]);

  const hasFilters =
    filters.categoryId || filters.brandId || filters.stockStatus || filters.sortBy;

  return (
    <div className="flex flex-col gap-5">
      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <Select
          value={filters.categoryId ?? ''}
          onValueChange={(val) =>
            update({ categoryId: val || undefined })
          }
        >
          <SelectTrigger className="w-full" id="filter-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-brand">Brand</Label>
        <Select
          value={filters.brandId ?? ''}
          onValueChange={(val) =>
            update({ brandId: val || undefined })
          }
        >
          <SelectTrigger className="w-full" id="filter-brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stock Status */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-stock">Stock Status</Label>
        <Select
          value={filters.stockStatus ?? 'all'}
          onValueChange={(val) =>
            update({ stockStatus: val === 'all' ? undefined : val ?? undefined })
          }
        >
          <SelectTrigger className="w-full" id="filter-stock">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-sort">Sort By</Label>
        <Select
          value={filters.sortBy ?? ''}
          onValueChange={(val) =>
            update({ sortBy: val || undefined })
          }
        >
          <SelectTrigger className="w-full" id="filter-sort">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Default</SelectItem>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" data-icon="inline-start" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export function ProductFilters({
  filters,
  onChange,
  categories,
  brands,
  open,
  onOpenChange,
}: ProductFiltersProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto px-4 pb-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
            </SheetTitle>
          </SheetHeader>

          <div className="mt-2">
            <FilterFields
              filters={filters}
              onChange={onChange}
              categories={categories}
              brands={brands}
            />
          </div>

          <div className="mt-6">
            <Button
              className="w-full"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: sidebar panel, always visible when open
  if (!open) return null;

  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10',
        'lg:flex',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onOpenChange(false)}
          aria-label="Close filters"
        >
          <X className="size-4" />
        </Button>
      </div>

      <FilterFields
        filters={filters}
        onChange={onChange}
        categories={categories}
        brands={brands}
      />
    </aside>
  );
}
