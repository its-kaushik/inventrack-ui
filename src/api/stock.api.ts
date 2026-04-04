import type { StockItem, StockSummary } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet } from '@/api/client'

export interface StockFilters {
  category_id?: string
  status?: string
  limit?: number
  offset?: number
}

export function getStockOverview(filters?: StockFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<StockItem> & { summary: StockSummary }>(
    `/stock${qs ? `?${qs}` : ''}`,
  )
}

export function getProductStock(productId: string) {
  return apiGet<StockItem>(`/stock/${productId}`)
}

export function getStockHistory(productId: string) {
  return apiGet<
    Array<{
      id: string
      type: string
      quantity: number
      referenceId: string | null
      createdAt: string
    }>
  >(`/stock/${productId}/history`)
}
