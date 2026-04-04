import type { PurchaseReturn } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface PurchaseReturnFilters {
  purchase_id?: string
  limit?: number
  offset?: number
}

export function createPurchaseReturn(data: {
  purchaseId: string
  items: Array<{ productId: string; quantity: number; costPrice: number; reason: string }>
}) {
  return apiPost<PurchaseReturn>('/purchases/returns', data)
}

export function listPurchaseReturns(filters?: PurchaseReturnFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<PurchaseReturn>>(`/purchases/returns${qs ? `?${qs}` : ''}`)
}

export function getPurchaseReturn(id: string) {
  return apiGet<PurchaseReturn>(`/purchases/returns/${id}`)
}
