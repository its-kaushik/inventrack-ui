import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'
import { getMe } from '@/api/auth.api'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const tenant = useAuthStore((s) => s.tenant)

  const loginMutation = useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      authApi.login(phone, password),
    onSuccess: async (response) => {
      const { user, accessToken } = response.data
      // Login response does not include tenant; set auth first, then fetch full profile
      useAuthStore.getState().setAuth(user, accessToken, null)
      try {
        const meResponse = await getMe()
        const { tenant } = meResponse.data
        if (tenant) {
          useAuthStore.getState().setTenant(tenant)
        }
      } catch {
        // Tenant will be loaded on next session restore
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      useAuthStore.getState().logout()
    },
  })

  return {
    user,
    isAuthenticated,
    tenant,
    loginMutation,
    logoutMutation,
  }
}
