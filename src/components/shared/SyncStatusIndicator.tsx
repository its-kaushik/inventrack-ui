import { RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SyncStatusIndicatorProps {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  pendingCount?: number;
  className?: string;
}

export function SyncStatusIndicator({
  status,
  pendingCount,
  className,
}: SyncStatusIndicatorProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      {status === 'synced' && (
        <>
          <span className="size-2 rounded-full bg-success-500" aria-hidden="true" />
          <span className="text-neutral-500">Synced</span>
        </>
      )}

      {status === 'syncing' && (
        <>
          <RefreshCw
            className="size-3.5 animate-spin text-primary-600"
            aria-hidden="true"
          />
          <span className="text-neutral-500">Syncing...</span>
        </>
      )}

      {status === 'offline' && (
        <>
          <WifiOff className="size-3.5 text-error-500" aria-hidden="true" />
          <span className="text-neutral-500">Offline</span>
          {pendingCount != null && pendingCount > 0 && (
            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-error-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {pendingCount}
            </span>
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <span className="size-2 rounded-full bg-error-500" aria-hidden="true" />
          <span className="text-error-700">Sync error</span>
        </>
      )}
    </div>
  );
}
