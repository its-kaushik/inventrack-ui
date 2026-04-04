import type { StockAdjustment } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface StockAdjustmentFilters {
  product_id?: string
  reason?: string
  limit?: number
  offset?: number
}

export function createStockAdjustment(data: {
  productId: string
  quantityChange: number
  reason: string
  notes?: string
}) {
  return apiPost<StockAdjustment>('/stock/adjust', data)
}

/** NOTE: No list endpoint is documented in the API; this may not be available server-side. */
export function listStockAdjustments(filters?: StockAdjustmentFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<StockAdjustment>>(`/stock/adjustments${qs ? `?${qs}` : ''}`)
}
