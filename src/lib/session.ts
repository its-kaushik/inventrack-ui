import { useAuthStore } from '@/stores/auth.store'
import { refreshToken, getMe } from '@/api/auth.api'

/**
 * Attempts to restore an existing session on app startup.
 *
 * Calls POST /auth/refresh (the HTTP-only refresh cookie is sent automatically).
 * On success, fetches the full user/tenant profile via GET /auth/me and
 * hydrates the auth store so the user skips the login page.
 *
 * On failure (no cookie, expired token, network error) this is a silent no-op --
 * the user simply stays on the login page.
 */
export async function restoreSession(): Promise<void> {
  try {
    const refreshResponse = await refreshToken()
    const { accessToken } = refreshResponse.data

    // Temporarily set the token so the /auth/me call can authenticate
    useAuthStore.getState().setAccessToken(accessToken)

    const meResponse = await getMe()
    const { user, tenant } = meResponse.data

    useAuthStore.getState().setAuth(user, accessToken, tenant)
  } catch {
    // Silent failure — user will be directed to login
  }
}
