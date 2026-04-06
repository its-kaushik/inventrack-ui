import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/cn';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 bg-error-500 px-4 py-2 text-sm font-medium text-white',
        className,
      )}
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You are offline. Changes will sync when connected.
    </div>
  );
}
