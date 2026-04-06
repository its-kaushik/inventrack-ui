'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, error, className }: PhoneInputProps) {
  const errorId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 10 characters
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    onChange(raw);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        maxLength={10}
        placeholder="10-digit mobile number"
        className={cn(
          'h-11 w-full rounded-lg border bg-background px-3 text-base text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'outline-none transition-colors',
          error
            ? 'border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20'
            : 'border-input',
        )}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
