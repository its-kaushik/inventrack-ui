import type { DashboardData, SalespersonDashboardData } from '@/types/models'
import { apiGet } from '@/api/client'

// GET /dashboard returns role-dependent data:
// - Owner/Manager: DashboardData (full stats)
// - Salesperson: SalespersonDashboardData (own sales only)
export function getDashboard() {
  return apiGet<DashboardData | SalespersonDashboardData>('/dashboard')
}
