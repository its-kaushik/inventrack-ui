import {
  TrendingUp,
  IndianRupee,
  Package,
  Truck,
  Users,
  Receipt,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { reportsApi, type ReportParams } from '@/api/reports.api';

// ── Types ──

export interface ReportColumn {
  key: string;
  header: string;
  format?: 'currency' | 'number' | 'date' | 'percent';
}

export interface ReportConfig {
  key: string;
  title: string;
  description: string;
  group: 'sales' | 'profit' | 'inventory' | 'purchase' | 'credit' | 'staff' | 'expense' | 'gst';
  fetcher: (params?: ReportParams) => Promise<{ data: unknown }>;
  columns: ReportColumn[];
  chartType?: 'bar' | 'line' | 'pie' | 'none';
  chartDataKey?: string;
  chartCategoryKey?: string;
  csvExport?: (params?: ReportParams) => Promise<Blob>;
}

export interface ReportGroup {
  key: string;
  label: string;
  icon: LucideIcon;
}

// ── Report Groups ──

export const REPORT_GROUPS: ReportGroup[] = [
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'profit', label: 'Profit', icon: IndianRupee },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'purchase', label: 'Purchase', icon: Truck },
  { key: 'credit', label: 'Credit', icon: Users },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'expense', label: 'Expense', icon: Receipt },
  { key: 'gst', label: 'GST', icon: FileText },
];

// ── Report Configs ──

export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  // ── Sales ──
  'sales-summary': {
    key: 'sales-summary',
    title: 'Sales Summary',
    description: 'Revenue, COGS, and profit overview',
    group: 'sales',
    fetcher: reportsApi.salesSummary,
    columns: [
      { key: 'period', header: 'Period' },
      { key: 'revenue', header: 'Revenue', format: 'currency' },
      { key: 'cogs', header: 'COGS', format: 'currency' },
      { key: 'grossProfit', header: 'Gross Profit', format: 'currency' },
      { key: 'margin', header: 'Margin', format: 'percent' },
    ],
    chartType: 'bar',
    chartDataKey: 'revenue',
    chartCategoryKey: 'period',
  },
  'sales-by-category': {
    key: 'sales-by-category',
    title: 'Sales by Category',
    description: 'Revenue breakdown by product category',
    group: 'sales',
    fetcher: reportsApi.salesByCategory,
    columns: [
      { key: 'category', header: 'Category' },
      { key: 'revenue', header: 'Revenue', format: 'currency' },
      { key: 'quantity', header: 'Quantity', format: 'number' },
    ],
    chartType: 'bar',
    chartDataKey: 'revenue',
    chartCategoryKey: 'category',
  },
  'sales-by-product': {
    key: 'sales-by-product',
    title: 'Sales by Product',
    description: 'Detailed sales per product and variant',
    group: 'sales',
    fetcher: reportsApi.salesByProduct,
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'variant', header: 'Variant' },
      { key: 'revenue', header: 'Revenue', format: 'currency' },
      { key: 'quantity', header: 'Quantity', format: 'number' },
      { key: 'profit', header: 'Profit', format: 'currency' },
      { key: 'margin', header: 'Margin', format: 'percent' },
    ],
    chartType: 'none',
  },
  'sales-by-brand': {
    key: 'sales-by-brand',
    title: 'Sales by Brand',
    description: 'Revenue breakdown by brand',
    group: 'sales',
    fetcher: reportsApi.salesByBrand,
    columns: [
      { key: 'brand', header: 'Brand' },
      { key: 'revenue', header: 'Revenue', format: 'currency' },
      { key: 'quantity', header: 'Quantity', format: 'number' },
    ],
    chartType: 'bar',
    chartDataKey: 'revenue',
    chartCategoryKey: 'brand',
  },
  'sales-trend': {
    key: 'sales-trend',
    title: 'Sales Trend',
    description: 'Daily revenue and transaction trend',
    group: 'sales',
    fetcher: reportsApi.salesTrend,
    columns: [
      { key: 'date', header: 'Date', format: 'date' },
      { key: 'revenue', header: 'Revenue', format: 'currency' },
      { key: 'transactions', header: 'Transactions', format: 'number' },
    ],
    chartType: 'line',
    chartDataKey: 'revenue',
    chartCategoryKey: 'date',
  },

  // ── Profit ──
  'profit-margins': {
    key: 'profit-margins',
    title: 'Product Margins',
    description: 'Selling price, cost price, and margin per product',
    group: 'profit',
    fetcher: reportsApi.profitMargins,
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'sellingPrice', header: 'Selling Price', format: 'currency' },
      { key: 'costPrice', header: 'Cost Price', format: 'currency' },
      { key: 'profit', header: 'Profit', format: 'currency' },
      { key: 'marginPct', header: 'Margin %', format: 'percent' },
    ],
    chartType: 'none',
  },
  'pnl': {
    key: 'pnl',
    title: 'P&L Statement',
    description: 'Profit and loss summary for the period',
    group: 'profit',
    fetcher: reportsApi.pnl,
    columns: [
      { key: 'item', header: 'Item' },
      { key: 'amount', header: 'Amount', format: 'currency' },
    ],
    chartType: 'none',
  },
  'discount-impact': {
    key: 'discount-impact',
    title: 'Discount Impact',
    description: 'MRP vs net revenue after discounts',
    group: 'profit',
    fetcher: reportsApi.discountImpact,
    columns: [
      { key: 'period', header: 'Period' },
      { key: 'mrpRevenue', header: 'MRP Revenue', format: 'currency' },
      { key: 'discountGiven', header: 'Discount Given', format: 'currency' },
      { key: 'discountPct', header: 'Discount %', format: 'percent' },
      { key: 'netRevenue', header: 'Net Revenue', format: 'currency' },
    ],
    chartType: 'none',
  },

  // ── Inventory ──
  'current-stock': {
    key: 'current-stock',
    title: 'Current Stock',
    description: 'Available stock with cost and MRP valuation',
    group: 'inventory',
    fetcher: reportsApi.currentStock,
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'variant', header: 'Variant' },
      { key: 'sku', header: 'SKU' },
      { key: 'available', header: 'Available', format: 'number' },
      { key: 'costValue', header: 'Cost Value', format: 'currency' },
      { key: 'mrpValue', header: 'MRP Value', format: 'currency' },
    ],
    chartType: 'none',
  },
  'inventory-valuation': {
    key: 'inventory-valuation',
    title: 'Inventory Valuation',
    description: 'Stock value summary by category',
    group: 'inventory',
    fetcher: reportsApi.inventoryValuation,
    columns: [
      { key: 'category', header: 'Category' },
      { key: 'items', header: 'Items', format: 'number' },
      { key: 'costValue', header: 'Cost Value', format: 'currency' },
      { key: 'mrpValue', header: 'MRP Value', format: 'currency' },
    ],
    chartType: 'none',
  },
  'dead-stock': {
    key: 'dead-stock',
    title: 'Dead/Slow Stock',
    description: 'Items not sold for an extended period',
    group: 'inventory',
    fetcher: reportsApi.deadStock,
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'variant', header: 'Variant' },
      { key: 'sku', header: 'SKU' },
      { key: 'quantity', header: 'Quantity', format: 'number' },
      { key: 'ageDays', header: 'Age (Days)', format: 'number' },
      { key: 'costValue', header: 'Cost Value', format: 'currency' },
    ],
    chartType: 'none',
  },
  'low-stock': {
    key: 'low-stock',
    title: 'Low Stock',
    description: 'Items below reorder threshold',
    group: 'inventory',
    fetcher: reportsApi.lowStock,
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'variant', header: 'Variant' },
      { key: 'sku', header: 'SKU' },
      { key: 'available', header: 'Available', format: 'number' },
      { key: 'threshold', header: 'Threshold', format: 'number' },
    ],
    chartType: 'none',
  },

  // ── Purchase ──
  'supplier-purchases': {
    key: 'supplier-purchases',
    title: 'Purchases by Supplier',
    description: 'Purchase totals and outstanding per supplier',
    group: 'purchase',
    fetcher: reportsApi.supplierPurchases,
    columns: [
      { key: 'supplier', header: 'Supplier' },
      { key: 'totalPurchases', header: 'Total Purchases', format: 'currency' },
      { key: 'totalPaid', header: 'Total Paid', format: 'currency' },
      { key: 'outstanding', header: 'Outstanding', format: 'currency' },
    ],
    chartType: 'none',
  },
  'purchase-summary': {
    key: 'purchase-summary',
    title: 'Purchase Summary',
    description: 'Period-wise purchase totals',
    group: 'purchase',
    fetcher: reportsApi.purchaseSummary,
    columns: [
      { key: 'period', header: 'Period' },
      { key: 'totalPurchases', header: 'Total Purchases', format: 'currency' },
      { key: 'itemCount', header: 'Item Count', format: 'number' },
    ],
    chartType: 'bar',
    chartDataKey: 'totalPurchases',
    chartCategoryKey: 'period',
  },

  // ── Credit ──
  'customer-outstanding': {
    key: 'customer-outstanding',
    title: 'Customer Outstanding',
    description: 'Pending credit amounts per customer',
    group: 'credit',
    fetcher: reportsApi.customerOutstanding,
    columns: [
      { key: 'customer', header: 'Customer' },
      { key: 'phone', header: 'Phone' },
      { key: 'outstanding', header: 'Outstanding', format: 'currency' },
      { key: 'lastPayment', header: 'Last Payment', format: 'date' },
      { key: 'ageDays', header: 'Age (Days)', format: 'number' },
    ],
    chartType: 'none',
  },
  'supplier-outstanding': {
    key: 'supplier-outstanding',
    title: 'Supplier Outstanding',
    description: 'Pending payments to suppliers',
    group: 'credit',
    fetcher: reportsApi.supplierOutstanding,
    columns: [
      { key: 'supplier', header: 'Supplier' },
      { key: 'outstanding', header: 'Outstanding', format: 'currency' },
      { key: 'dueDate', header: 'Due Date', format: 'date' },
      { key: 'ageDays', header: 'Age (Days)', format: 'number' },
    ],
    chartType: 'none',
  },
  'credit-aging': {
    key: 'credit-aging',
    title: 'Credit Aging',
    description: 'Outstanding credit by aging buckets',
    group: 'credit',
    fetcher: reportsApi.creditAging,
    columns: [
      { key: 'bucket', header: 'Bucket' },
      { key: 'customerCount', header: 'Customers', format: 'number' },
      { key: 'amount', header: 'Amount', format: 'currency' },
    ],
    chartType: 'pie',
    chartDataKey: 'amount',
    chartCategoryKey: 'bucket',
  },
  'payment-collections': {
    key: 'payment-collections',
    title: 'Payment Collections',
    description: 'Recent credit payment collections',
    group: 'credit',
    fetcher: reportsApi.paymentCollections,
    columns: [
      { key: 'customer', header: 'Customer' },
      { key: 'amount', header: 'Amount', format: 'currency' },
      { key: 'mode', header: 'Mode' },
      { key: 'date', header: 'Date', format: 'date' },
    ],
    chartType: 'none',
  },

  // ── Staff ──
  'staff-activity': {
    key: 'staff-activity',
    title: 'Staff Activity',
    description: 'Stock entries and bills created per staff member',
    group: 'staff',
    fetcher: reportsApi.staffActivity,
    columns: [
      { key: 'staff', header: 'Staff' },
      { key: 'role', header: 'Role' },
      { key: 'stockEntries', header: 'Stock Entries', format: 'number' },
      { key: 'billsCreated', header: 'Bills Created', format: 'number' },
    ],
    chartType: 'none',
  },

  // ── Expense ──
  'expense-summary': {
    key: 'expense-summary',
    title: 'Expense Summary',
    description: 'Expenses broken down by category',
    group: 'expense',
    fetcher: reportsApi.expenseSummary,
    columns: [
      { key: 'category', header: 'Category' },
      { key: 'amount', header: 'Amount', format: 'currency' },
      { key: 'count', header: 'Count', format: 'number' },
    ],
    chartType: 'pie',
    chartDataKey: 'amount',
    chartCategoryKey: 'category',
  },

  // ── GST ──
  'gst-summary': {
    key: 'gst-summary',
    title: 'GST Summary',
    description: 'Period-wise taxable turnover and GST breakup',
    group: 'gst',
    fetcher: reportsApi.gstSummary,
    columns: [
      { key: 'period', header: 'Period' },
      { key: 'taxableTurnover', header: 'Taxable Turnover', format: 'currency' },
      { key: 'cgst', header: 'CGST', format: 'currency' },
      { key: 'sgst', header: 'SGST', format: 'currency' },
      { key: 'totalTax', header: 'Total Tax', format: 'currency' },
    ],
    chartType: 'none',
    csvExport: reportsApi.gstr1Export,
  },
  'hsn-summary': {
    key: 'hsn-summary',
    title: 'HSN Summary',
    description: 'HSN-wise quantity, taxable value, and GST',
    group: 'gst',
    fetcher: reportsApi.hsnSummary,
    columns: [
      { key: 'hsnCode', header: 'HSN Code' },
      { key: 'description', header: 'Description' },
      { key: 'quantity', header: 'Quantity', format: 'number' },
      { key: 'taxableValue', header: 'Taxable Value', format: 'currency' },
      { key: 'cgst', header: 'CGST', format: 'currency' },
      { key: 'sgst', header: 'SGST', format: 'currency' },
      { key: 'total', header: 'Total', format: 'currency' },
    ],
    chartType: 'none',
    csvExport: reportsApi.gstr3bExport,
  },
};
