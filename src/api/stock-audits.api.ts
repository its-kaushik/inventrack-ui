import type { StockAudit } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface StockAuditFilters {
  status?: string
  limit?: number
  offset?: number
}

export function createStockAudit(data: {
  items: Array<{ productId: string; countedQty: number }>
}) {
  return apiPost<StockAudit>('/stock/audit', data)
}

/** NOTE: No list endpoint is documented in the API for stock audits. */
export function listStockAudits(filters?: StockAuditFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<StockAudit>>(`/stock/audit${qs ? `?${qs}` : ''}`)
}

export function getStockAudit(id: string) {
  return apiGet<StockAudit>(`/stock/audit/${id}`)
}

export function approveStockAudit(auditId: string) {
  return apiPost<{ auditId: string; adjustmentsApplied: number; message: string }>(
    '/stock/audit/approve',
    { auditId },
  )
}
