import type { ApiResponse } from '@/types/api'
import { ApiError, AuthError } from '@/types/api'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'

const BASE_URL = `${env.apiUrl}/api/v1`

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

async function attemptTokenRefresh(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        useAuthStore.getState().logout()
        throw new AuthError('Session expired. Please log in again.')
      }

      const json = (await res.json()) as ApiResponse<{ accessToken: string }>
      if (!json.success) {
        useAuthStore.getState().logout()
        throw new AuthError('Session expired. Please log in again.')
      }

      const { accessToken } = json.data
      useAuthStore.getState().setAccessToken(accessToken)
      return accessToken
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const { accessToken } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const url = `${BASE_URL}${path}`

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  // On 401, attempt a token refresh and retry once
  if (res.status === 401) {
    try {
      const newToken = await attemptTokenRefresh()
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    } catch (err) {
      if (err instanceof AuthError) throw err
      useAuthStore.getState().logout()
      throw new AuthError('Session expired. Please log in again.')
    }
  }

  // On 429, retry once after a short backoff
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000
    await new Promise(resolve => setTimeout(resolve, delay))
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  }

  const json = (await res.json()) as ApiResponse<T>

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'An unexpected error occurred',
      json.error?.details,
      res.status,
    )
  }

  return json
}

export function apiGet<T>(path: string, options?: RequestInit) {
  return apiClient<T>(path, { ...options, method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiClient<T>(path, {
    ...options,
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiClient<T>(path, {
    ...options,
    method: 'PUT',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiClient<T>(path, {
    ...options,
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T>(path: string, options?: RequestInit) {
  return apiClient<T>(path, { ...options, method: 'DELETE' })
}
