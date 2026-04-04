import type { User } from '@/types/models'
import type { UserRole } from '@/types/enums'
import { apiGet, apiPost, apiPatch } from '@/api/client'

export function listUsers() {
  return apiGet<User[]>('/users')
}

export function getUser(id: string) {
  return apiGet<User>(`/users/${id}`)
}

export function createUser(data: {
  name: string
  phone: string
  email?: string
  role: UserRole
  password: string
}) {
  return apiPost<User>('/users', data)
}

export function updateUser(
  id: string,
  data: Partial<{
    name: string
    phone: string
    email: string | null
    role: UserRole
    isActive: boolean
  }>,
) {
  return apiPatch<User>(`/users/${id}`, data)
}

export function resetUserPassword(id: string, newPassword: string) {
  return apiPost<void>(`/users/${id}/reset-password`, { newPassword })
}
