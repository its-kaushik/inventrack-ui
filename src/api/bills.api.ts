import type { Bill } from '@/types/models'
import type { PaymentMode } from '@/types/enums'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiDelete } from '@/api/client'

export interface CreateBillData {
  items: Array<{
    productId: string
    quantity: number
  }>
  payments: Array<{
    mode: PaymentMode
    amount: number
    reference?: string
  }>
  customerId?: string | null
  additionalDiscountAmount?: number
  additionalDiscountPct?: number
  clientId?: string
  notes?: string | null
}

export interface BillFilters {
  customer_id?: string
  salesperson_id?: string
  status?: string
  limit?: number
  offset?: number
}

export function createBill(data: CreateBillData) {
  return apiPost<Bill>('/bills', data)
}

export function listBills(filters?: BillFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<Bill>>(`/bills${qs ? `?${qs}` : ''}`)
}

export function getBill(id: string) {
  return apiGet<Bill>(`/bills/${id}`)
}

export function getBillPrintData(id: string) {
  return apiGet<Bill>(`/bills/${id}/print`)
}

export function voidBill(id: string) {
  return apiPost<Bill>(`/bills/${id}/void`)
}

export function syncBills(bills: Array<{ clientId: string; payload: unknown }>) {
  return apiPost<{ synced: string[]; conflicts: Array<{ clientId: string; error: string }> }>(
    '/bills/sync',
    { bills },
  )
}

// ── Held (draft) bills ───────────────────────────────────

export interface HeldBillData {
  items: Array<{ productId: string; quantity: number }>
  customerId?: string
  additionalDiscountAmount?: number
  notes?: string
}

export interface HeldBill extends HeldBillData {
  id: string
  createdAt: string
}

export function holdBill(data: HeldBillData) {
  return apiPost<HeldBill>('/bills/hold', data)
}

export function listHeldBills() {
  return apiGet<HeldBill[]>('/bills/held')
}

export function resumeHeldBill(id: string) {
  return apiPost<HeldBillData>(`/bills/held/${id}/resume`)
}

export function deleteHeldBill(id: string) {
  return apiDelete<{ deleted: boolean }>(`/bills/held/${id}`)
}
