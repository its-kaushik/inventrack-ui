'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/cn';

interface CurrencyInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const formatter = new Intl.NumberFormat('en-IN');

function formatIndian(num: number): string {
  return formatter.format(num);
}

function stripNonDigits(str: string): string {
  return str.replace(/[^0-9]/g, '');
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className,
  disabled = false,
}: CurrencyInputProps) {
  const displayValue = value === '' ? '' : formatIndian(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripNonDigits(e.target.value);
      if (raw === '') {
        onChange('');
        return;
      }
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        onChange(num);
      }
    },
    [onChange],
  );

  return (
    <div className={cn('relative flex items-center', className)}>
      <span
        className="pointer-events-none absolute left-3 text-base font-medium text-neutral-500"
        aria-hidden="true"
      >
        ₹
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'h-11 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-base text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'outline-none transition-colors',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
        )}
        aria-label="Amount in rupees"
      />
    </div>
  );
}
