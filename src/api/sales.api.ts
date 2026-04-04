import type { SalesOverviewData } from '@/types/models'
import { apiGet } from '@/api/client'

export interface SalesOverviewParams {
  period?: string
  date_from?: string
  date_to?: string
}

export function getSalesOverview(params?: SalesOverviewParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.set(key, String(value))
    })
  }
  const qs = searchParams.toString()
  return apiGet<SalesOverviewData>(`/reports/sales-overview${qs ? `?${qs}` : ''}`)
}
