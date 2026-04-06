import { cn } from '@/lib/cn';

type StatusColor = 'green' | 'amber' | 'red' | 'blue';

interface StatusBadgeProps {
  status: StatusColor;
  label: string;
  className?: string;
}

const statusStyles: Record<StatusColor, { bg: string; text: string; dot: string }> = {
  green: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    dot: 'bg-success-500',
  },
  amber: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    dot: 'bg-warning-500',
  },
  red: {
    bg: 'bg-error-50',
    text: 'text-error-700',
    dot: 'bg-error-500',
  },
  blue: {
    bg: 'bg-info-50',
    text: 'text-info-500',
    dot: 'bg-info-500',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = statusStyles[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles.bg,
        styles.text,
        className,
      )}
      role="status"
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', styles.dot)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
