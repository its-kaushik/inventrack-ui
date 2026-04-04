import type { Tenant, TenantSettings } from '@/types/models'
import { apiGet, apiPost, apiPut, apiPatch } from '@/api/client'

export function setupTenant(data: {
  storeName: string
  ownerName: string
  phone: string
  password: string
  email?: string
  address?: string
  gstin?: string
  gstScheme?: string
}) {
  return apiPost<{ tenant: Tenant; owner: import('@/types/models').User }>('/setup/tenant', data)
}

export function completeSetupWizard() {
  return apiPut<void>('/setup/wizard')
}

export function getSettings() {
  return apiGet<TenantSettings>('/settings')
}

export function updateSettings(data: Partial<TenantSettings>) {
  return apiPatch<TenantSettings>('/settings', data)
}

export function getStoreSettings() {
  return apiGet<Tenant>('/settings/store')
}

export function updateStoreSettings(data: Partial<Tenant>) {
  return apiPatch<Tenant>('/settings/store', data)
}

export function exportData() {
  return apiPost<{ jobId: string; message: string }>('/settings/export-data')
}
