import type { Purchase } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface CreatePurchaseData {
  supplierId: string
  poId?: string
  invoiceNumber?: string | null
  invoiceDate?: string | null
  invoiceImageUrl?: string | null
  totalAmount: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  isRcm?: boolean
  items: Array<{
    productId: string
    quantity: number
    costPrice: number
    gstRate?: number
    gstAmount?: number
  }>
}

export interface PurchaseFilters {
  supplier_id?: string
  limit?: number
  offset?: number
}

export function createPurchase(data: CreatePurchaseData) {
  return apiPost<Purchase>('/purchases', data)
}

export function listPurchases(filters?: PurchaseFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<Purchase>>(`/purchases${qs ? `?${qs}` : ''}`)
}

export function getPurchase(id: string) {
  return apiGet<Purchase>(`/purchases/${id}`)
}
