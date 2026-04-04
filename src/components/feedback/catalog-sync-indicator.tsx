import { useSyncExternalStore } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { getSyncState, onSyncStateChange } from '@/lib/catalog-sync'
import { cn } from '@/lib/utils'

function subscribe(callback: () => void) {
  return onSyncStateChange(callback)
}

export function CatalogSyncIndicator() {
  const state = useSyncExternalStore(subscribe, getSyncState, () => 'idle' as const)

  if (state === 'idle') return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        state === 'syncing' && 'text-muted-foreground',
        state === 'ready' && 'text-green-600',
        state === 'error' && 'text-destructive',
      )}
    >
      {state === 'syncing' && (
        <>
          <Loader2 className="size-3 animate-spin" /> Syncing...
        </>
      )}
      {state === 'ready' && (
        <>
          <Check className="size-3" /> Synced
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle className="size-3" /> Sync failed
        </>
      )}
    </div>
  )
}
