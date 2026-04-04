import { useState, useEffect } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { getPendingBillCount } from '@/lib/offline-bills'
import { useOnline } from '@/hooks/use-online'

export function SyncIndicator() {
  const isOnline = useOnline()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const check = async () => {
      const count = await getPendingBillCount()
      setPendingCount(count)
    }
    check()
    const interval = setInterval(check, 5000) // check every 5s
    return () => clearInterval(interval)
  }, [])

  if (pendingCount === 0 && isOnline) return null

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {!isOnline && (
        <span className="flex items-center gap-1 text-amber-600">
          <CloudOff className="size-3" /> Offline
        </span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <RefreshCw className="size-3 animate-spin" /> {pendingCount} bill{pendingCount > 1 ? 's' : ''} pending
        </span>
      )}
    </div>
  )
}
