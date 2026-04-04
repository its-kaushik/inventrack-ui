import { create } from 'zustand'
import type { User, Tenant } from '@/types/models'

export interface AuthState {
  user: User | null
  accessToken: string | null
  tenant: Tenant | null
  isAuthenticated: boolean

  setAuth: (user: User, accessToken: string, tenant: Tenant | null) => void
  setAccessToken: (token: string) => void
  setTenant: (tenant: Tenant) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  tenant: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, tenant) =>
    set({ user, accessToken, tenant, isAuthenticated: true }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  setTenant: (tenant) =>
    set({ tenant }),

  logout: () =>
    set({ user: null, accessToken: null, tenant: null, isAuthenticated: false }),
}))
