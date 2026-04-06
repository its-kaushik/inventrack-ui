import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface OfflineImagePlaceholderProps {
  className?: string;
}

export function OfflineImagePlaceholder({ className }: OfflineImagePlaceholderProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-neutral-100',
        className,
      )}
      role="img"
      aria-label="Image unavailable"
    >
      <ImageOff className="size-8 text-neutral-400" aria-hidden="true" />
    </div>
  );
}
