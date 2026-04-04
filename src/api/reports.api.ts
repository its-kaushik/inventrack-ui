import { apiGet, apiPost } from '@/api/client'

export function getReport(type: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null) params.set(key, String(value))
  })
  const qs = params.toString()
  return apiGet<unknown>(`/reports/${type}${qs ? `?${qs}` : ''}`)
}

export function exportReport(
  type: string,
  format: 'pdf' | 'xlsx',
  filters: Record<string, unknown>,
) {
  const body: Record<string, unknown> = { format, ...filters }
  return apiPost<{ jobId: string; message: string }>(`/reports/${type}/export`, body)
}

export function getExportStatus(jobId: string) {
  return apiGet<{ status: string }>(`/reports/export/${jobId}`)
}

/**
 * Report type slugs use hyphens (not underscores):
 * daily-sales, sales-by-category, sales-by-salesperson, inventory-valuation,
 * low-stock, outstanding-payables, outstanding-receivables, customer-ledger,
 * supplier-ledger, cash-register, pnl, purchase-summary, expense,
 * gst-summary, bargain-discount, aging-inventory, dead-stock
 */
