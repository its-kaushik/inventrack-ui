'use client';

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';

import { NumberStepper } from '@/components/shared';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';
import type { CartItem } from '@/stores/cart.store';

// ── Props ──

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const lineTotal = item.mrp * item.quantity;

  const handleQuantityChange = useCallback(
    (qty: number) => {
      onQuantityChange(item.variantId, qty);
    },
    [item.variantId, onQuantityChange],
  );

  const handleRemove = useCallback(() => {
    onRemove(item.variantId);
  }, [item.variantId, onRemove]);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-neutral-100 bg-white p-3">
      {/* Row 1: product name + unit MRP */}
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-foreground">
          {item.productName}
        </span>
        <span className="shrink-0 text-sm text-neutral-500">
          {formatINR(item.mrp)}
        </span>
      </div>

      {/* Row 2: variant description */}
      {item.variantDescription && (
        <span className="text-xs text-neutral-500">
          {item.variantDescription}
        </span>
      )}

      {/* Row 3: stepper + line total + delete */}
      <div className="flex items-center justify-between gap-2">
        <NumberStepper
          value={item.quantity}
          onChange={handleQuantityChange}
          min={1}
          max={999}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatINR(lineTotal)}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'flex size-11 items-center justify-center rounded-lg text-neutral-400 transition-colors',
              'hover:bg-error-50 hover:text-error-600',
              'active:bg-error-100',
            )}
            aria-label={`Remove ${item.productName}`}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
