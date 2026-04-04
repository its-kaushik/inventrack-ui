import type { AuditLogEntry } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet } from '@/api/client'

export interface AuditLogFilters {
  user_id?: string
  action?: string
  entity_type?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export function listAuditLogs(filters?: AuditLogFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<AuditLogEntry>>(`/audit-logs${qs ? `?${qs}` : ''}`)
}
