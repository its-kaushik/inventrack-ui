import { apiGet, apiPatch } from '@/api/client'

export interface Notification {
  id: string
  type: 'low_stock' | 'payment_due' | 'discrepancy' | 'daily_summary' | 'info'
  title: string
  message: string
  entityType?: string
  entityId?: string
  read: boolean
  createdAt: string
}

export function getUnreadCount() {
  return apiGet<{ count: number }>('/notifications/unread-count')
}

export function listNotifications(params?: { limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  const qs = searchParams.toString()
  return apiGet<{ items: Notification[]; hasMore: boolean }>(`/notifications${qs ? `?${qs}` : ''}`)
}

export function markAsRead(id: string) {
  return apiPatch<{ id: string; readAt: string }>(`/notifications/${id}/read`)
}

export function markAllAsRead() {
  return apiPatch<{ markedCount: number }>('/notifications/read-all')
}
