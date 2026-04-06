import { api } from './client';
import type { ApiResponse } from '@/types/api';

// ── Common params for all reports ──

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

// ── API functions — all follow the same pattern ──

export const reportsApi = {
  // Sales
  salesSummary: (p?: ReportParams) =>
    api.get('reports/sales-summary', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  salesByCategory: (p?: ReportParams) =>
    api.get('reports/sales-by-category', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  salesByProduct: (p?: ReportParams) =>
    api.get('reports/sales-by-product', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  salesByBrand: (p?: ReportParams) =>
    api.get('reports/sales-by-brand', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  salesTrend: (p?: ReportParams) =>
    api.get('reports/sales-trend', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Profit
  profitMargins: (p?: ReportParams) =>
    api.get('reports/profit-margins', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  pnl: (p?: ReportParams) =>
    api.get('reports/pnl', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  discountImpact: (p?: ReportParams) =>
    api.get('reports/discount-impact', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Inventory
  currentStock: (p?: ReportParams) =>
    api.get('reports/current-stock', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  inventoryValuation: (p?: ReportParams) =>
    api.get('reports/inventory-valuation', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  deadStock: (p?: ReportParams) =>
    api.get('reports/dead-stock', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  lowStock: (p?: ReportParams) =>
    api.get('reports/low-stock', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Purchase
  supplierPurchases: (p?: ReportParams) =>
    api.get('reports/supplier-purchases', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  purchaseSummary: (p?: ReportParams) =>
    api.get('reports/purchase-summary', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Credit
  customerOutstanding: (p?: ReportParams) =>
    api.get('reports/customer-outstanding', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  supplierOutstanding: (p?: ReportParams) =>
    api.get('reports/supplier-outstanding', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  creditAging: (p?: ReportParams) =>
    api.get('reports/credit-aging', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  paymentCollections: (p?: ReportParams) =>
    api.get('reports/payment-collections', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Staff
  staffActivity: (p?: ReportParams) =>
    api.get('reports/staff-activity', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // Expense
  expenseSummary: (p?: ReportParams) =>
    api.get('reports/expense-summary', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // GST
  gstSummary: (p?: ReportParams) =>
    api.get('reports/gst-summary', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),
  hsnSummary: (p?: ReportParams) =>
    api.get('reports/hsn-summary', { searchParams: p as Record<string, string> }).json<ApiResponse<unknown>>(),

  // GST Exports (return Blob for CSV download)
  gstr1Export: (p?: ReportParams) =>
    api.get('reports/gstr1-export', { searchParams: p as Record<string, string> }).blob(),
  gstr3bExport: (p?: ReportParams) =>
    api.get('reports/gstr3b-export', { searchParams: p as Record<string, string> }).blob(),
  cmp08Export: (p?: ReportParams) =>
    api.get('reports/cmp08-export', { searchParams: p as Record<string, string> }).blob(),
};
