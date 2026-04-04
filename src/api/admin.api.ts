import type { AdminDashboardData, TenantInfo, TenantUsageStats } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost } from '@/api/client'

export interface TenantFilters {
  status?: string
  plan?: string
  search?: string
  limit?: number
  offset?: number
}

export function getAdminDashboard() {
  return apiGet<AdminDashboardData>('/admin/dashboard')
}

export function listTenants(filters?: TenantFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value))
    })
  }
  const qs = params.toString()
  return apiGet<PaginatedResponse<TenantInfo>>(`/admin/tenants${qs ? `?${qs}` : ''}`)
}

export function getTenantDetail(id: string) {
  return apiGet<TenantInfo>(`/admin/tenants/${id}`)
}

export function getTenantUsage(id: string) {
  return apiGet<TenantUsageStats>(`/admin/tenants/${id}/usage`)
}

export function suspendTenant(id: string) {
  return apiPost<void>(`/admin/tenants/${id}/suspend`)
}

export function activateTenant(id: string) {
  return apiPost<void>(`/admin/tenants/${id}/activate`)
}

export function extendTrial(id: string, days: number) {
  return apiPost<void>(`/admin/tenants/${id}/extend-trial`, { days })
}

export function changePlan(id: string, plan: string) {
  return apiPost<void>(`/admin/tenants/${id}/plan`, { plan })
}
