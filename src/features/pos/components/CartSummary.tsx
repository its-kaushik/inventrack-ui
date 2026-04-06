'use client';

import { useState } from 'react';
import { Percent } from 'lucide-react';

import { DiscountIndicator } from '@/components/shared';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/stores/cart.store';
import { DiscountControls } from './DiscountControls';

// ── Component ──

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const discountResult = useCartStore((s) => s.discountResult);
  const billDiscountPct = useCartStore((s) => s.billDiscountPct);

  const [billDiscountOpen, setBillDiscountOpen] = useState(false);
  const [bargainOpen, setBargainOpen] = useState(false);

  if (items.length === 0 || !discountResult) return null;

  const {
    mrpSubtotal,
    productDiscountTotal,
    billDiscountAmount,
    bargainAdjustment,
    roundOff,
    netPayable,
    effectiveDiscountPct,
  } = discountResult;

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-white p-4">
        {/* MRP Subtotal */}
        <SummaryRow label="MRP Subtotal" value={formatINR(mrpSubtotal)} />

        {/* Product Discount */}
        {productDiscountTotal > 0 && (
          <SummaryRow
            label="Product Discount"
            value={`-${formatINR(productDiscountTotal)}`}
            valueClassName="text-success-600"
          />
        )}

        {/* Bill Discount */}
        <button
          type="button"
          className="flex items-center justify-between rounded-md px-0 py-0.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          onClick={() => setBillDiscountOpen(true)}
        >
          <span className="flex items-center gap-1 text-sm text-neutral-600">
            Bill Discount{billDiscountPct > 0 ? ` (${billDiscountPct}%)` : ''}
            <Percent className="size-3 text-neutral-400" />
          </span>
          <span
            className={cn(
              'text-sm tabular-nums',
              billDiscountAmount > 0 ? 'text-success-600' : 'text-neutral-400',
            )}
          >
            {billDiscountAmount > 0 ? `-${formatINR(billDiscountAmount)}` : formatINR(0)}
          </span>
        </button>

        {/* Bargain Adjustment */}
        <button
          type="button"
          className="flex items-center justify-between rounded-md px-0 py-0.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          onClick={() => setBargainOpen(true)}
        >
          <span className="text-sm text-neutral-600">Bargain Adjustment</span>
          <span
            className={cn(
              'text-sm tabular-nums',
              bargainAdjustment > 0 ? 'text-success-600' : 'text-neutral-400',
            )}
          >
            {bargainAdjustment > 0 ? `-${formatINR(bargainAdjustment)}` : formatINR(0)}
          </span>
        </button>

        {/* Round Off */}
        {roundOff !== 0 && (
          <SummaryRow
            label="Round Off"
            value={`${roundOff > 0 ? '+' : ''}${formatINR(Math.abs(roundOff))}`}
            valueClassName="text-neutral-400"
          />
        )}

        {/* Separator */}
        <div className="my-1 border-t border-neutral-200" />

        {/* Net Payable */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-foreground">Net Payable</span>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {formatINR(netPayable)}
          </span>
        </div>

        {/* Effective discount indicator */}
        {effectiveDiscountPct > 0 && (
          <div className="flex justify-end">
            <DiscountIndicator effectiveDiscountPct={effectiveDiscountPct} />
          </div>
        )}
      </div>

      {/* Discount control sheets */}
      <DiscountControls
        billDiscountOpen={billDiscountOpen}
        onBillDiscountOpenChange={setBillDiscountOpen}
        bargainOpen={bargainOpen}
        onBargainOpenChange={setBargainOpen}
      />
    </>
  );
}

// ── Internal helper ──

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={cn('text-sm tabular-nums text-foreground', valueClassName)}>
        {value}
      </span>
    </div>
  );
}
