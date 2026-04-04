import type { PurchaseOrder } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPut } from '@/api/client'

export interface POFilters {
  supplier_id?: string
  status?: string
  limit?: number
  offset?: number
}

export function listPurchaseOrders(filters?: POFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<PurchaseOrder>>(`/purchase-orders${qs ? `?${qs}` : ''}`)
}

export function getPurchaseOrder(id: string) {
  return apiGet<PurchaseOrder>(`/purchase-orders/${id}`)
}

export function createPurchaseOrder(data: {
  supplierId: string
  items: Array<{ productId: string; quantity: number; expectedCostPrice: number }>
  notes?: string
}) {
  return apiPost<PurchaseOrder>('/purchase-orders', data)
}

export function updatePurchaseOrder(
  id: string,
  data: Partial<{
    status: string
    notes: string
    items: Array<{ productId: string; quantity: number; expectedCostPrice: number }>
  }>,
) {
  return apiPut<PurchaseOrder>(`/purchase-orders/${id}`, data)
}
