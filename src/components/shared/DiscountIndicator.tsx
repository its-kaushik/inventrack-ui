import { cn } from '@/lib/cn';
import { getDiscountColor } from '@/lib/discount-engine';

interface DiscountIndicatorProps {
  effectiveDiscountPct: number;
  className?: string;
}

const colorStyles = {
  green: 'bg-success-50 text-success-700',
  amber: 'bg-warning-50 text-warning-700',
  red: 'bg-error-50 text-error-700',
} as const;

export function DiscountIndicator({ effectiveDiscountPct, className }: DiscountIndicatorProps) {
  const color = getDiscountColor(effectiveDiscountPct);
  const formatted = effectiveDiscountPct.toFixed(1) + '%';
  const withinLimit = effectiveDiscountPct < 30;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorStyles[color],
        className,
      )}
      aria-label={`Discount ${formatted}, ${withinLimit ? 'within limit' : 'exceeds limit'}`}
    >
      {formatted}
    </span>
  );
}
