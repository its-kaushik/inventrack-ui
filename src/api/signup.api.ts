import type { Tenant, User } from '@/types/models'
import { apiPost } from '@/api/client'

export function signupTenant(data: {
  storeName: string
  ownerName: string
  phone: string
  password: string
  email?: string
  address?: string
  gstin?: string
  gstScheme?: 'regular' | 'composition'
}) {
  return apiPost<{ tenant: Tenant; owner: User; accessToken: string }>('/signup', data)
}
