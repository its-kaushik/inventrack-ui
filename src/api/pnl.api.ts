import type { ProfitLossData } from '@/types/models'
import { apiGet } from '@/api/client'

export function getProfitLoss(params: { date_from: string; date_to: string }) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) searchParams.set(key, String(value))
  })
  const qs = searchParams.toString()
  return apiGet<ProfitLossData>(`/accounting/pnl${qs ? `?${qs}` : ''}`)
}
