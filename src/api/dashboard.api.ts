import { api } from './client';
import type { ApiResponse } from '@/types/api';

// ── Types ──

export interface DashboardData {
  // Today's sales
  todaySales: { total: string; count: number; avgTransaction: string };
  // Month-to-date comparison
  mtd: { currentMonth: string; lastMonth: string; changePercent: number };
  // Inventory alerts
  lowStockCount: number;
  agingStockCount: number;
  negativeStockCount: number;
  // Credit summary
  totalReceivable: string;
  totalPayable: string;
  overdueReceivableCount: number;
  overduePayableCount: number;
  // Top selling products (today/this week)
  topSelling: { productName: string; variantDescription: string | null; quantitySold: number; revenue: string }[];
  // Sync status
  pendingBillCount: number;
  unresolvedConflictCount: number;
  // Recent activity
  recentStockAdded: { productName: string; variantDescription: string | null; quantity: number; addedBy: string; addedAt: string }[];
}

// ── API functions ──

export const dashboardApi = {
  getSummary: () =>
    api.get('reports/dashboard').json<ApiResponse<DashboardData>>(),
};
