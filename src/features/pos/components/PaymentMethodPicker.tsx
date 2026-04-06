'use client';

import { IndianRupee, Phone, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types/enums';

// ── Config ──

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: typeof IndianRupee }[] = [
  { method: 'cash', label: 'Cash', icon: IndianRupee },
  { method: 'upi', label: 'UPI', icon: Phone },
  { method: 'card', label: 'Card', icon: CreditCard },
  { method: 'credit', label: 'Khata', icon: User },
];

// ── Props ──

interface PaymentMethodPickerProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map(({ method, label, icon: Icon }) => {
        const isSelected = selected === method;
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={cn(
              'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
            )}
            onClick={() => onSelect(method)}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
