import type { User, Tenant } from '@/types/models'
import { apiGet, apiPost } from '@/api/client'

interface LoginResponse {
  accessToken: string
  user: User
  tenant: Tenant | null
}

export function login(phone: string, password: string) {
  return apiPost<LoginResponse>('/auth/login', {
    phone,
    password,
  })
}

export function refreshToken() {
  return apiPost<{ accessToken: string }>('/auth/refresh')
}

export function logout() {
  return apiPost<void>('/auth/logout')
}

export function forgotPassword(phone: string) {
  return apiPost<void>('/auth/forgot-password', { phone })
}

export function resetPassword(token: string, newPassword: string) {
  return apiPost<void>('/auth/reset-password', { token, newPassword })
}

export function getMe() {
  return apiGet<{ user: User; tenant: Tenant | null }>('/auth/me')
}

// Convenience object export for hooks
export const authApi = {
  login,
  logout,
  me: getMe,
}
