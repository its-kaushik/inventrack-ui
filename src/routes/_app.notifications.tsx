import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  DollarSign,
  AlertCircle,
  BarChart3,
  Info,
  CheckCheck,
  Loader2,
  BellOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopBar } from '@/components/layout/top-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/api/notifications.api'
import { useNotificationStore } from '@/stores/notification.store'
import { getUnreadCount } from '@/api/notifications.api'

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
})

const typeConfig: Record<
  Notification['type'],
  { icon: LucideIcon; colorClass: string }
> = {
  low_stock: { icon: AlertTriangle, colorClass: 'text-amber-500 bg-amber-500/10' },
  payment_due: { icon: DollarSign, colorClass: 'text-red-500 bg-red-500/10' },
  discrepancy: { icon: AlertCircle, colorClass: 'text-red-500 bg-red-500/10' },
  daily_summary: { icon: BarChart3, colorClass: 'text-blue-500 bg-blue-500/10' },
  info: { icon: Info, colorClass: 'text-blue-500 bg-blue-500/10' },
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getNotificationRoute(n: Notification): string | null {
  if (!n.entityType || !n.entityId) return null
  switch (n.entityType) {
    case 'stock':
      return '/inventory/stock'
    case 'customer':
      return `/customers/${n.entityId}`
    case 'supplier':
      return `/suppliers/${n.entityId}`
    case 'bill':
      return `/pos/bills/${n.entityId}`
    default:
      return null
  }
}

const PAGE_SIZE = 20

function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState<Notification[]>([])

  const { isLoading, isFetching } = useQuery({
    queryKey: ['notifications', offset],
    queryFn: async () => {
      const res = await listNotifications({ limit: PAGE_SIZE, offset })
      setAllItems((prev) => {
        if (offset === 0) return res.data.items
        const existingIds = new Set(prev.map((n) => n.id))
        const newItems = res.data.items.filter((n) => !existingIds.has(n.id))
        return [...prev, ...newItems]
      })
      return res.data
    },
  })

  const hasMore = useQuery({
    queryKey: ['notifications', offset],
    queryFn: async () => {
      const res = await listNotifications({ limit: PAGE_SIZE, offset })
      return res.data
    },
    enabled: false,
  }).data?.hasMore

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.data.count)
    } catch {
      /* ignore */
    }
  }, [setUnreadCount])

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: (_data, id) => {
      setAllItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refreshUnread()
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      setAllItems((prev) => prev.map((n) => ({ ...n, read: true })))
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refreshUnread()
    },
  })

  function handleClick(n: Notification) {
    if (!n.read) {
      markReadMutation.mutate(n.id)
    }
    const route = getNotificationRoute(n)
    if (route) {
      navigate({ to: route })
    }
  }

  const hasUnread = allItems.some((n) => !n.read)

  return (
    <>
      <TopBar title="Notifications" showBack />
      <div className="p-4 space-y-4">
        {/* Header actions */}
        {hasUnread && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              {markAllMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Mark all as read
            </Button>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : allItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="size-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-lg">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up! Notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {allItems.map((n) => {
              const config = typeConfig[n.type] ?? typeConfig.info
              const Icon = config.icon
              const clickable = !!getNotificationRoute(n)

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    !n.read && 'bg-muted/50',
                    clickable && 'hover:bg-accent cursor-pointer',
                    !clickable && 'cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      config.colorClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm',
                          !n.read && 'font-semibold'
                        )}
                      >
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </button>
              )
            })}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
