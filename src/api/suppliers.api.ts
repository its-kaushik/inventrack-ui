import type { Supplier, LedgerEntry, Product } from '@/types/models'
import type { SupplierPaymentMode } from '@/types/enums'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPut } from '@/api/client'

export function listSuppliers(search?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const qs = params.toString()
  return apiGet<Supplier[]>(`/suppliers${qs ? `?${qs}` : ''}`)
}

export function getSupplier(id: string) {
  return apiGet<Supplier>(`/suppliers/${id}`)
}

export function createSupplier(data: {
  name: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  gstin?: string | null
  paymentTerms?: string | null
  notes?: string | null
}) {
  return apiPost<Supplier>('/suppliers', data)
}

export function updateSupplier(
  id: string,
  data: Partial<{
    name: string
    contactPerson: string | null
    phone: string | null
    email: string | null
    address: string | null
    gstin: string | null
    paymentTerms: string | null
    notes: string | null
  }>,
) {
  return apiPut<Supplier>(`/suppliers/${id}`, data)
}

export function getSupplierLedger(
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
  return apiGet<PaginatedResponse<LedgerEntry>>(`/suppliers/${id}/ledger${qs ? `?${qs}` : ''}`)
}

export function recordSupplierPayment(
  id: string,
  data: {
    amount: number
    paymentMode: SupplierPaymentMode
    paymentReference?: string | null
    description?: string | null
  },
) {
  return apiPost<void>(`/suppliers/${id}/payments`, data)
}

export function getSupplierProducts(id: string) {
  return apiGet<Product[]>(`/suppliers/${id}/products`)
}
