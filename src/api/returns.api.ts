import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface ReturnItem {
  billItemId: string
  quantity: number
}

export interface CreateReturnData {
  originalBillId: string
  refundMode: 'cash' | 'credit_note' | 'exchange'
  reason?: string
  items: ReturnItem[]
  exchangeBillId?: string
}

export interface ReturnRecord {
  id: string
  originalBillId: string
  refundMode: string
  reason: string | null
  totalRefundAmount: string
  items: Array<{
    billItemId: string
    productId: string
    productName: string
    quantity: number
    refundAmount: string
  }>
  createdAt: string
}

export function createReturn(data: CreateReturnData) {
  return apiPost<ReturnRecord>('/returns', data)
}

export function listReturns(filters?: {
  original_bill_id?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<ReturnRecord>>(`/returns${qs ? `?${qs}` : ''}`)
}

export function getReturn(id: string) {
  return apiGet<ReturnRecord>(`/returns/${id}`)
}
