'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CurrencyInput } from '@/components/shared';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/stores/cart.store';

// ── Props ──

interface DiscountControlsProps {
  billDiscountOpen: boolean;
  onBillDiscountOpenChange: (open: boolean) => void;
  bargainOpen: boolean;
  onBargainOpenChange: (open: boolean) => void;
}

export function DiscountControls({
  billDiscountOpen,
  onBillDiscountOpenChange,
  bargainOpen,
  onBargainOpenChange,
}: DiscountControlsProps) {
  return (
    <>
      <BillDiscountSheet
        open={billDiscountOpen}
        onOpenChange={onBillDiscountOpenChange}
      />
      <BargainSheet
        open={bargainOpen}
        onOpenChange={onBargainOpenChange}
      />
    </>
  );
}

// ── Bill Discount Sheet ──

function BillDiscountSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const currentPct = useCartStore((s) => s.billDiscountPct);
  const setBillDiscountPct = useCartStore((s) => s.setBillDiscountPct);
  const [pct, setPct] = useState('');

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      setPct(currentPct > 0 ? String(currentPct) : '');
    }
  }, [open, currentPct]);

  const handleApply = () => {
    const parsed = parseFloat(pct);
    const value = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setBillDiscountPct(value);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bill Discount</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="bill-discount-pct">Discount Percentage</Label>
            <div className="relative flex items-center">
              <Input
                id="bill-discount-pct"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.5}
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                placeholder="0"
                className="h-11 pr-8 text-base"
                autoFocus
              />
              <span
                className="pointer-events-none absolute right-3 text-sm text-neutral-400"
                aria-hidden="true"
              >
                %
              </span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Bargain Sheet ──

function BargainSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const discountResult = useCartStore((s) => s.discountResult);
  const currentBargainAdjustment = useCartStore((s) => s.bargainAdjustment);
  const finalPriceOverride = useCartStore((s) => s.finalPriceOverride);
  const setBargainAdjustment = useCartStore((s) => s.setBargainAdjustment);
  const setFinalPriceOverride = useCartStore((s) => s.setFinalPriceOverride);

  const [mode, setMode] = useState<'discount' | 'final'>('discount');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [finalPrice, setFinalPrice] = useState<number | ''>('');

  const totalAfterBillDiscount = discountResult?.totalAfterBillDiscount ?? 0;

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      if (finalPriceOverride != null) {
        setMode('final');
        setFinalPrice(finalPriceOverride);
        setDiscountAmount('');
      } else {
        setMode('discount');
        setDiscountAmount(currentBargainAdjustment > 0 ? currentBargainAdjustment : '');
        setFinalPrice('');
      }
    }
  }, [open, currentBargainAdjustment, finalPriceOverride]);

  const previewTotal =
    mode === 'discount'
      ? totalAfterBillDiscount - (typeof discountAmount === 'number' ? discountAmount : 0)
      : typeof finalPrice === 'number'
        ? finalPrice
        : totalAfterBillDiscount;

  const handleApply = () => {
    if (mode === 'discount') {
      const amount = typeof discountAmount === 'number' ? discountAmount : 0;
      setBargainAdjustment(Math.max(0, amount));
    } else {
      const price = typeof finalPrice === 'number' ? finalPrice : null;
      setFinalPriceOverride(price);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bargain Adjustment</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {/* Mode tabs */}
          <Tabs
            value={mode}
            onValueChange={(val) => setMode(val as 'discount' | 'final')}
          >
            <TabsList className="w-full">
              <TabsTrigger value="discount" className="flex-1">
                Discount Amount
              </TabsTrigger>
              <TabsTrigger value="final" className="flex-1">
                Final Price
              </TabsTrigger>
            </TabsList>

            {/* Discount mode */}
            <TabsContent value="discount">
              <div className="space-y-1.5 pt-3">
                <Label>Amount Off</Label>
                <CurrencyInput
                  value={discountAmount}
                  onChange={setDiscountAmount}
                  placeholder="0"
                />
              </div>
            </TabsContent>

            {/* Final price mode */}
            <TabsContent value="final">
              <div className="space-y-1.5 pt-3">
                <Label>Customer Pays</Label>
                <CurrencyInput
                  value={finalPrice}
                  onChange={setFinalPrice}
                  placeholder="0"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <div className="rounded-lg bg-neutral-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">New Total</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatINR(Math.max(0, Math.round(previewTotal)))}
              </span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
