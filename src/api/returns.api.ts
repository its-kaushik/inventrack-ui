import type { Bill } from '@/types/models'
import { apiGet, apiPost } from '@/api/client'

export interface ReturnItem {
  billItemId: string
  quantity: number
  reason: string
}

export interface CreateReturnData {
  billId: string
  items: ReturnItem[]
  refundMode: 'cash' | 'credit_note' | 'exchange'
  exchangeItems?: Array<{ productId: string; quantity: number }>
  notes?: string
}

export function createReturn(billId: string, data: Omit<CreateReturnData, 'billId'>) {
  return apiPost<{ returnId: string; refundAmount: number }>(`/bills/${billId}/return`, data)
}

export function getReturnableItems(billId: string) {
  return apiGet<{
    bill: Bill
    items: Array<{
      billItemId: string
      productId: string
      productName: string
      sku: string
      size: string | null
      originalQuantity: number
      returnedQuantity: number
      returnableQuantity: number
      unitPrice: string
      catalogDiscountPct: number
    }>
  }>(`/bills/${billId}/returnable`)
}
