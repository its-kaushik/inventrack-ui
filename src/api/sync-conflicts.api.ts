import { apiGet, apiPost } from '@/api/client'
import type { PaginatedResponse } from '@/types/api'

export interface SyncConflict {
  id: string
  clientId: string
  reason: string
  status: 'pending' | 'resolved'
  action?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export interface SyncConflictFilters {
  status?: 'pending' | 'resolved'
  limit?: number
  offset?: number
}

export function listSyncConflicts(filters?: SyncConflictFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<SyncConflict>>(`/sync-conflicts${qs ? `?${qs}` : ''}`)
}

export function resolveSyncConflict(
  id: string,
  data: { action: 'force_accepted' | 'edited' | 'voided'; notes?: string },
) {
  return apiPost<SyncConflict>(`/sync-conflicts/${id}/resolve`, data)
}

export function getSyncConflictCount() {
  return apiGet<{ count: number }>('/sync-conflicts/count')
}
