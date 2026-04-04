import { WifiOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnline } from '@/hooks/use-online'
import { useUiStore } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'

interface OfflineBannerProps {
  className?: string
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnline()
  const dismissed = useUiStore((s) => s.offlineBannerDismissed)
  const dismiss = useUiStore((s) => s.dismissOfflineBanner)

  if (isOnline || dismissed) return null

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 shrink-0" />
        <span>You're offline. Changes will sync when you reconnect.</span>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
        onClick={dismiss}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
