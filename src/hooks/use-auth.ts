import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const tenant = useAuthStore((s) => s.tenant)

  const loginMutation = useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      authApi.login(phone, password),
    onSuccess: (response) => {
      const { user, accessToken } = response.data
      const tenant = user.tenant ?? response.data.tenant
      useAuthStore.getState().setAuth(user, accessToken, tenant)
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
