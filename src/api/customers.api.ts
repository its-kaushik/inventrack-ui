import type { Customer, LedgerEntry } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPut } from '@/api/client'

export function searchCustomersByPhone(phone: string) {
  return apiGet<Customer[]>(`/customers/search?phone=${encodeURIComponent(phone)}`)
}

export interface CustomerFilters {
  search?: string
  with_balance?: boolean
  limit?: number
  offset?: number
}

export function listCustomers(filters?: CustomerFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<Customer>>(`/customers${qs ? `?${qs}` : ''}`)
}

export function getCustomer(id: string) {
  return apiGet<Customer>(`/customers/${id}`)
}

export function createCustomer(data: {
  name: string
  phone: string
  email?: string | null
  address?: string | null
}) {
  return apiPost<Customer>('/customers', data)
}

export function updateCustomer(
  id: string,
  data: Partial<{
    name: string
    phone: string
    email: string | null
    address: string | null
  }>,
) {
  return apiPut<Customer>(`/customers/${id}`, data)
}

export function getCustomerLedger(
  id: string,
  params?: { limit?: number; offset?: number },
) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<PaginatedResponse<LedgerEntry>>(`/customers/${id}/ledger${qs ? `?${qs}` : ''}`)
}

export function recordCustomerPayment(
  id: string,
  data: {
    amount: number
    paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card'
    paymentReference?: string | null
    description?: string | null
  },
) {
  return apiPost<void>(`/customers/${id}/payments`, data)
}
