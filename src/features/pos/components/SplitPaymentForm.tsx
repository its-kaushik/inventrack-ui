'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/shared';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';
import type { CartPayment } from '@/stores/cart.store';
import type { PaymentMethod } from '@/types/enums';

// ── Types ──

interface PaymentRow {
  id: number;
  method: PaymentMethod;
  amount: number | '';
}

// ── Props ──

interface SplitPaymentFormProps {
  netPayable: number;
  onComplete: (payments: CartPayment[]) => void;
}

let rowIdCounter = 0;

export function SplitPaymentForm({ netPayable, onComplete }: SplitPaymentFormProps) {
  const [rows, setRows] = useState<PaymentRow[]>([
    { id: ++rowIdCounter, method: 'cash', amount: netPayable },
  ]);
  const [putRemainingOnKhata, setPutRemainingOnKhata] = useState(false);

  // Calculated totals
  const totalPaid = useMemo(
    () => rows.reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0),
    [rows],
  );

  const remaining = netPayable - totalPaid;
  const isBalanced = remaining === 0 || (remaining > 0 && putRemainingOnKhata);
  const isSingleRow = rows.length === 1;

  // ── Handlers ──

  const updateRowMethod = useCallback((id: number, method: PaymentMethod) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, method } : r)));
  }, []);

  const updateRowAmount = useCallback((id: number, amount: number | '') => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount } : r)));
    // Reset khata checkbox when amounts change
    setPutRemainingOnKhata(false);
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: ++rowIdCounter, method: 'cash', amount: '' },
    ]);
    setPutRemainingOnKhata(false);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      // Must always have at least one row
      return filtered.length === 0 ? [{ id: ++rowIdCounter, method: 'cash', amount: '' }] : filtered;
    });
    setPutRemainingOnKhata(false);
  }, []);

  const handleComplete = () => {
    const payments: CartPayment[] = rows
      .filter((r) => typeof r.amount === 'number' && r.amount > 0)
      .map((r) => ({
        method: r.method,
        amount: r.amount as number,
      }));

    // Add khata payment for remaining
    if (putRemainingOnKhata && remaining > 0) {
      payments.push({ method: 'credit', amount: remaining });
    }

    onComplete(payments);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Payment rows */}
      {rows.map((row, index) => (
        <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-3">
          {/* Row header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600">
              Payment {rows.length > 1 ? `#${index + 1}` : ''}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Remove payment"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Method picker */}
          <PaymentMethodPicker
            selected={row.method}
            onSelect={(method) => updateRowMethod(row.id, method)}
          />

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <CurrencyInput
              value={row.amount}
              onChange={(val) => updateRowAmount(row.id, val)}
              placeholder="0"
            />
          </div>
        </div>
      ))}

      {/* Add split payment button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={addRow}
        className="w-full"
      >
        <Plus className="size-4" />
        Split Payment
      </Button>

      {/* Running total */}
      <div className="rounded-lg bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Paid</span>
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              totalPaid >= netPayable ? 'text-success-600' : 'text-foreground',
            )}
          >
            {formatINR(totalPaid)} / {formatINR(netPayable)}
          </span>
        </div>

        {remaining > 0 && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-neutral-400">Remaining</span>
            <span className="text-sm font-medium tabular-nums text-warning-600">
              {formatINR(remaining)}
            </span>
          </div>
        )}
      </div>

      {/* Khata checkbox */}
      {remaining > 0 && totalPaid > 0 && (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-100 bg-white p-3">
          <Checkbox
            checked={putRemainingOnKhata}
            onCheckedChange={(checked) => setPutRemainingOnKhata(!!checked)}
          />
          <span className="text-sm text-foreground">
            Put {formatINR(remaining)} remaining on Khata
          </span>
        </label>
      )}

      {/* Complete button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!isBalanced || totalPaid === 0}
        onClick={handleComplete}
      >
        <Check className="size-4" />
        Complete Payment
      </Button>
    </div>
  );
}
