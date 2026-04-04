import type { GstDashboardData } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet } from '@/api/client'

export interface GstParams {
  period?: string
}

export interface ItcFilters {
  supplier_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export function getGstDashboard(params?: GstParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<GstDashboardData>(`/accounting/gst${qs ? `?${qs}` : ''}`)
}

export function getGstReturnData(returnType: string, params?: GstParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<unknown>(`/accounting/gst/${returnType}${qs ? `?${qs}` : ''}`)
}

export function getItcRegister(filters?: ItcFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<unknown>>(`/accounting/gst/itc${qs ? `?${qs}` : ''}`)
}
