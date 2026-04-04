import type { GstDashboardData } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet } from '@/api/client'

export interface GstParams {
  from?: string
  to?: string
  quarter?: number
  fy?: string
  /** @deprecated Use from/to instead. Kept for backward compatibility with period selectors. */
  period?: string
}

export interface ItcFilters {
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export function getGstSummary(params?: GstParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<GstDashboardData>(`/gst/summary${qs ? `?${qs}` : ''}`)
}

export function getGstReturnData(returnType: string, params?: GstParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<unknown>(`/gst/${returnType}${qs ? `?${qs}` : ''}`)
}

export function getItcRegister(filters?: ItcFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<unknown>>(`/gst/itc${qs ? `?${qs}` : ''}`)
}

export function getHsnSummary(params?: { from?: string; to?: string }) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<unknown>(`/gst/hsn-summary${qs ? `?${qs}` : ''}`)
}

// Keep backward-compatible alias
export const getGstDashboard = getGstSummary
