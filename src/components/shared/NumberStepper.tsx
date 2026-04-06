'use client';

import { useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className,
}: NumberStepperProps) {
  const isAtMin = value <= min;
  const isAtMax = value >= max;

  const decrement = useCallback(() => {
    const next = value - step;
    onChange(Math.max(min, next));
  }, [value, step, min, onChange]);

  const increment = useCallback(() => {
    const next = value + step;
    onChange(Math.min(max, next));
  }, [value, step, max, onChange]);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-input',
        className,
      )}
      role="group"
      aria-label="Quantity stepper"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={isAtMin}
        className={cn(
          'flex size-11 items-center justify-center rounded-l-lg text-foreground transition-colors',
          'hover:bg-neutral-100 active:bg-neutral-200',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        )}
        aria-label="Decrease"
      >
        <Minus className="size-5" />
      </button>
      <span
        className="flex min-w-12 items-center justify-center border-x border-input px-3 text-base font-medium tabular-nums text-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={isAtMax}
        className={cn(
          'flex size-11 items-center justify-center rounded-r-lg text-foreground transition-colors',
          'hover:bg-neutral-100 active:bg-neutral-200',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        )}
        aria-label="Increase"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}
