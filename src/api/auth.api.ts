import type { User } from '@/types/models'
import { apiGet, apiPost } from '@/api/client'

interface LoginResponse {
  accessToken: string
  user: User & { setupComplete?: boolean }
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
  return apiGet<User & { tenant: import('@/types/models').Tenant }>('/auth/me')
}

export function verifyOtp(phone: string, otp: string) {
  return apiPost<{ accessToken: string; user: User }>('/auth/verify-otp', { phone, otp })
}

export function resendOtp(phone: string) {
  return apiPost<void>('/auth/send-otp', { phone })
}

// Convenience object export for hooks
export const authApi = {
  login,
  logout,
  me: getMe,
}
