import type { AdminDashboardData, TenantInfo, TenantUsageStats } from '@/types/models'
import type { PaginatedResponse } from '@/types/api'
import { apiGet, apiPost, apiPatch } from '@/api/client'

export interface TenantFilters {
  status?: string
  plan?: string
  search?: string
  limit?: number
  offset?: number
}

export function adminLogin(email: string, password: string) {
  return apiPost<{
    accessToken: string
    admin: { id: string; email: string; role: string }
  }>('/admin/login', { email, password })
}

export function adminRefresh() {
  return apiPost<{ accessToken: string }>('/admin/refresh')
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

export function updateTenant(
  id: string,
  data: Partial<{ status: 'active' | 'suspended'; plan: 'free' | 'basic' | 'pro' }>,
) {
  return apiPatch<TenantInfo>(`/admin/tenants/${id}`, data)
}

// Backward-compatible convenience wrappers
export function suspendTenant(id: string) {
  return updateTenant(id, { status: 'suspended' })
}

export function activateTenant(id: string) {
  return updateTenant(id, { status: 'active' })
}

export function changePlan(id: string, plan: 'free' | 'basic' | 'pro') {
  return updateTenant(id, { plan })
}

/**
 * @deprecated Use updateTenant() instead. The API no longer has a dedicated extend-trial endpoint.
 */
/** @deprecated Use updateTenant() instead */
export const extendTrial = updateTenant
