import type { StockAudit } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface StockAuditFilters {
  status?: string
  limit?: number
  offset?: number
}

export function createStockAudit(data: {
  lines: Array<{ productId: string; countedQuantity: number }>
}) {
  return apiPost<StockAudit>('/stock/audits', data)
}

export function listStockAudits(filters?: StockAuditFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<StockAudit>>(`/stock/audits${qs ? `?${qs}` : ''}`)
}

export function getStockAudit(id: string) {
  return apiGet<StockAudit>(`/stock/audits/${id}`)
}

export function approveStockAudit(id: string) {
  return apiPost<StockAudit>(`/stock/audits/${id}/approve`)
}
