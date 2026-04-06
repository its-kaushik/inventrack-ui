import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductVariant } from '@/types/models';

export interface VariantTableProps {
  variants: ProductVariant[];
}

type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

function getStockLevel(variant: ProductVariant): StockLevel {
  if (variant.availableQuantity === 0) return 'out_of_stock';
  if (
    variant.lowStockThreshold != null &&
    variant.availableQuantity <= variant.lowStockThreshold
  )
    return 'low_stock';
  return 'in_stock';
}

const stockTextClass: Record<StockLevel, string> = {
  in_stock: 'text-success-500',
  low_stock: 'text-warning-500',
  out_of_stock: 'text-error-500',
};

const rowBgClass: Record<StockLevel, string> = {
  in_stock: '',
  low_stock: 'bg-warning-50',
  out_of_stock: 'bg-error-50',
};

export function VariantTable({ variants }: VariantTableProps) {
  if (variants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No variants found.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">MRP</TableHead>
            <TableHead className="text-right">Cost (WAC)</TableHead>
            <TableHead>Barcode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => {
            const level = getStockLevel(variant);
            const color = variant.attributes?.color ?? '\u2014';
            const size = variant.attributes?.size ?? '\u2014';

            return (
              <TableRow
                key={variant.id}
                className={cn(rowBgClass[level])}
              >
                <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                  {color}
                </TableCell>
                <TableCell>{size}</TableCell>
                <TableCell className={cn('text-right font-medium tabular-nums', stockTextClass[level])}>
                  {variant.availableQuantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatINR(variant.mrp)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatINR(variant.weightedAvgCost)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {variant.barcode || '\u2014'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
