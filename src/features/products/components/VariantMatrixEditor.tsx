import { useState, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface VariantRow {
  key: string;
  attributes: Record<string, string>;
  included: boolean;
  costPrice: number;
  mrp: number;
  quantity: number;
  lowStockThreshold: number | null;
}

export interface VariantMatrixEditorProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  className?: string;
}

function isRowInvalid(row: VariantRow): { cost: boolean; mrp: boolean } {
  const costInvalid = row.costPrice <= 0 || row.costPrice > row.mrp;
  const mrpInvalid = row.mrp <= 0;
  return { cost: costInvalid, mrp: mrpInvalid };
}

export function VariantMatrixEditor({
  variants,
  onChange,
  className,
}: VariantMatrixEditorProps) {
  const [bulkCost, setBulkCost] = useState('');
  const [bulkMrp, setBulkMrp] = useState('');
  const [bulkThreshold, setBulkThreshold] = useState('');

  const allIncluded = variants.length > 0 && variants.every((v) => v.included);
  const someIncluded = variants.some((v) => v.included);

  const toggleAll = useCallback(() => {
    const nextIncluded = !allIncluded;
    onChange(variants.map((v) => ({ ...v, included: nextIncluded })));
  }, [allIncluded, variants, onChange]);

  const toggleRow = useCallback(
    (key: string) => {
      onChange(
        variants.map((v) =>
          v.key === key ? { ...v, included: !v.included } : v,
        ),
      );
    },
    [variants, onChange],
  );

  const updateRow = useCallback(
    (key: string, patch: Partial<VariantRow>) => {
      onChange(
        variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
      );
    },
    [variants, onChange],
  );

  const applyAllCost = useCallback(() => {
    const val = parseFloat(bulkCost);
    if (isNaN(val) || val <= 0) return;
    onChange(
      variants.map((v) => (v.included ? { ...v, costPrice: val } : v)),
    );
  }, [bulkCost, variants, onChange]);

  const applyAllMrp = useCallback(() => {
    const val = parseFloat(bulkMrp);
    if (isNaN(val) || val <= 0) return;
    onChange(
      variants.map((v) => (v.included ? { ...v, mrp: val } : v)),
    );
  }, [bulkMrp, variants, onChange]);

  const applyAllThreshold = useCallback(() => {
    const val = bulkThreshold.trim() === '' ? null : parseInt(bulkThreshold, 10);
    if (val !== null && (isNaN(val) || val < 0)) return;
    onChange(
      variants.map((v) => (v.included ? { ...v, lowStockThreshold: val } : v)),
    );
  }, [bulkThreshold, variants, onChange]);

  // Summary
  const summary = useMemo(() => {
    const included = variants.filter((v) => v.included);
    const totalUnits = included.reduce((sum, v) => sum + v.quantity, 0);
    const totalCost = included.reduce(
      (sum, v) => sum + v.costPrice * v.quantity,
      0,
    );
    return {
      selectedCount: included.length,
      totalUnits,
      totalCost,
    };
  }, [variants]);

  // Get attribute keys from first variant for display label
  const attrKeys = useMemo(() => {
    if (variants.length === 0) return [];
    return Object.keys(variants[0].attributes);
  }, [variants]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Bulk header row */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allIncluded}
            indeterminate={someIncluded && !allIncluded}
            onCheckedChange={toggleAll}
            aria-label="Select all variants"
          />
          <span className="text-xs font-medium text-muted-foreground">
            Select All
          </span>
        </div>

        <div className="flex items-end gap-1.5">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Cost</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Cost"
              value={bulkCost}
              onChange={(e) => setBulkCost(e.target.value)}
              className="w-24"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={applyAllCost}
            disabled={!bulkCost}
            aria-label="Apply cost to all selected"
          >
            <Check className="size-3.5" data-icon="inline-start" />
            Apply
          </Button>
        </div>

        <div className="flex items-end gap-1.5">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">MRP</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="MRP"
              value={bulkMrp}
              onChange={(e) => setBulkMrp(e.target.value)}
              className="w-24"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={applyAllMrp}
            disabled={!bulkMrp}
            aria-label="Apply MRP to all selected"
          >
            <Check className="size-3.5" data-icon="inline-start" />
            Apply
          </Button>
        </div>
      </div>

      {/* Variant rows */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_100px_100px_80px] items-center gap-3 border-b px-2 py-2 text-xs font-medium text-muted-foreground">
            <span className="w-5" />
            <span>Variant</span>
            <span className="text-right">Cost</span>
            <span className="text-right">MRP</span>
            <span className="text-right">Qty</span>
          </div>

          {/* Rows */}
          {variants.map((row) => {
            const validation = isRowInvalid(row);
            const attrLabel = attrKeys
              .map((k) => row.attributes[k])
              .filter(Boolean)
              .join(' \u00B7 ');

            return (
              <div
                key={row.key}
                className={cn(
                  'grid grid-cols-[auto_1fr_100px_100px_80px] items-center gap-3 border-b px-2 py-2 transition-colors',
                  !row.included && 'opacity-40',
                )}
              >
                <Checkbox
                  checked={row.included}
                  onCheckedChange={() => toggleRow(row.key)}
                  aria-label={`Include ${attrLabel}`}
                />

                <span className="truncate text-sm font-medium text-foreground">
                  {attrLabel || row.key}
                </span>

                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.costPrice || ''}
                  onChange={(e) =>
                    updateRow(row.key, {
                      costPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!row.included}
                  className={cn(
                    'text-right tabular-nums',
                    row.included && validation.cost && 'border-error-500 ring-1 ring-error-500/30',
                  )}
                  aria-label={`Cost for ${attrLabel}`}
                />

                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.mrp || ''}
                  onChange={(e) =>
                    updateRow(row.key, {
                      mrp: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!row.included}
                  className={cn(
                    'text-right tabular-nums',
                    row.included && validation.mrp && 'border-error-500 ring-1 ring-error-500/30',
                  )}
                  aria-label={`MRP for ${attrLabel}`}
                />

                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={row.quantity || ''}
                  onChange={(e) =>
                    updateRow(row.key, {
                      quantity: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  disabled={!row.included}
                  className="text-right tabular-nums"
                  aria-label={`Quantity for ${attrLabel}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Low stock threshold */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            Low Stock Threshold (all)
          </Label>
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 5"
            value={bulkThreshold}
            onChange={(e) => setBulkThreshold(e.target.value)}
            className="w-28"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applyAllThreshold}
          aria-label="Apply threshold to all selected"
        >
          <Check className="size-3.5" data-icon="inline-start" />
          Apply
        </Button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">
            {summary.selectedCount}
          </span>{' '}
          variants selected
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">
            {summary.totalUnits}
          </span>{' '}
          total units
        </span>
        <span className="text-muted-foreground">
          Total cost:{' '}
          <span className="font-semibold text-foreground">
            {formatINR(summary.totalCost)}
          </span>
        </span>
      </div>
    </div>
  );
}
