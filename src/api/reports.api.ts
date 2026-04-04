import { apiGet } from '@/api/client'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'

export function getReport(type: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null) params.set(key, String(value))
  })
  const qs = params.toString()
  return apiGet<unknown>(`/reports/${type}${qs ? `?${qs}` : ''}`)
}

export async function exportReport(
  type: string,
  format: 'pdf' | 'xlsx',
  filters: Record<string, unknown>,
) {
  const params = new URLSearchParams({ format })
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null) params.set(key, String(value))
  })

  const { accessToken } = useAuthStore.getState()
  const res = await fetch(`${env.apiUrl}/api/v1/reports/${type}/export?${params}`, {
    headers: {
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Export failed')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${type}-report.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
