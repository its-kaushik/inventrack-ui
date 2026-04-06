import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  className?: string;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-success-700',
  },
  down: {
    icon: TrendingDown,
    color: 'text-error-700',
  },
  flat: {
    icon: Minus,
    color: 'text-neutral-400',
  },
} as const;

export function MetricCard({ label, value, trend, trendValue, className }: MetricCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <div
      className={cn(
        'bg-white rounded-card shadow-card p-4',
        className,
      )}
    >
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
      {trendInfo && TrendIcon && (
        <div className={cn('mt-2 flex items-center gap-1 text-sm', trendInfo.color)}>
          <TrendIcon className="size-4" aria-hidden="true" />
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </div>
  );
}
