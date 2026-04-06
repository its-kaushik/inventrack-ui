import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FABProps {
  icon?: LucideIcon;
  onClick: () => void;
  label: string;
  className?: string;
}

export function FAB({ icon: Icon = Plus, onClick, label, className }: FABProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 active:bg-primary-800',
        className,
      )}
    >
      <Icon className="size-6" aria-hidden="true" />
    </button>
  );
}
