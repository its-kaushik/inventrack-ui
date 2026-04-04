import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getReport } from '@/api/reports.api'
import type { Column } from '@/components/data/data-table'
import type { ReportData } from '@/types/models'
import { Amount } from '@/components/data/amount'
import { ReportViewer } from '@/features/reports/report-viewer'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format-date'

export const Route = createFileRoute('/_app/reports/$type')({
  component: ReportViewerPage,
})

// ── Column definitions per report type ───────────────────

const REPORT_CONFIGS: Record<
  string,
  {
    title: string
    columns: Column<Record<string, unknown>>[]
  }
> = {
  daily_sales: {
    title: 'Daily Sales Summary',
    columns: [
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'totalSales', header: 'Total Sales', render: (row) => <Amount value={Number(row.totalSales)} /> },
      { key: 'billCount', header: 'Bills', render: (row) => String(row.billCount) },
      { key: 'returns', header: 'Returns', render: (row) => <Amount value={Number(row.returns)} /> },
      { key: 'netSales', header: 'Net Sales', render: (row) => <Amount value={Number(row.netSales)} /> },
      { key: 'cashSales', header: 'Cash', render: (row) => <Amount value={Number(row.cashSales)} />, hideOnMobile: true },
      { key: 'upiSales', header: 'UPI', render: (row) => <Amount value={Number(row.upiSales)} />, hideOnMobile: true },
    ],
  },

  sales_by_category: {
    title: 'Sales by Category',
    columns: [
      { key: 'categoryName', header: 'Category', render: (row) => String(row.categoryName) },
      { key: 'totalSales', header: 'Total Sales', render: (row) => <Amount value={Number(row.totalSales)} /> },
      { key: 'quantity', header: 'Qty Sold', render: (row) => String(row.quantity) },
      { key: 'billCount', header: 'Bills', render: (row) => String(row.billCount) },
      { key: 'avgBillValue', header: 'Avg Bill Value', render: (row) => <Amount value={Number(row.avgBillValue)} />, hideOnMobile: true },
      { key: 'percentage', header: '% Share', render: (row) => `${Number(row.percentage).toFixed(1)}%`, hideOnMobile: true },
    ],
  },

  sales_by_brand: {
    title: 'Sales by Brand',
    columns: [
      { key: 'brandName', header: 'Brand', render: (row) => String(row.brandName) },
      { key: 'totalSales', header: 'Total Sales', render: (row) => <Amount value={Number(row.totalSales)} /> },
      { key: 'quantity', header: 'Qty Sold', render: (row) => String(row.quantity) },
      { key: 'billCount', header: 'Bills', render: (row) => String(row.billCount) },
      { key: 'avgSellingPrice', header: 'Avg Price', render: (row) => <Amount value={Number(row.avgSellingPrice)} />, hideOnMobile: true },
      { key: 'percentage', header: '% Share', render: (row) => `${Number(row.percentage).toFixed(1)}%`, hideOnMobile: true },
    ],
  },

  sales_by_salesperson: {
    title: 'Sales by Salesperson',
    columns: [
      { key: 'userName', header: 'Salesperson', render: (row) => String(row.userName) },
      { key: 'totalSales', header: 'Total Sales', render: (row) => <Amount value={Number(row.totalSales)} /> },
      { key: 'billCount', header: 'Bills', render: (row) => String(row.billCount) },
      { key: 'avgBillValue', header: 'Avg Bill', render: (row) => <Amount value={Number(row.avgBillValue)} /> },
      { key: 'returns', header: 'Returns', render: (row) => <Amount value={Number(row.returns)} />, hideOnMobile: true },
      { key: 'netSales', header: 'Net Sales', render: (row) => <Amount value={Number(row.netSales)} />, hideOnMobile: true },
    ],
  },

  inventory_valuation: {
    title: 'Inventory Valuation',
    columns: [
      { key: 'productName', header: 'Product', render: (row) => String(row.productName) },
      { key: 'sku', header: 'SKU', render: (row) => String(row.sku), hideOnMobile: true },
      { key: 'currentStock', header: 'Qty', render: (row) => String(row.currentStock) },
      { key: 'costPrice', header: 'Cost Price', render: (row) => <Amount value={Number(row.costPrice)} /> },
      { key: 'totalValue', header: 'Total Value', render: (row) => <Amount value={Number(row.totalValue)} /> },
      { key: 'categoryName', header: 'Category', render: (row) => String(row.categoryName), hideOnMobile: true },
    ],
  },

  aging_inventory: {
    title: 'Aging Inventory',
    columns: [
      { key: 'productName', header: 'Product', render: (row) => String(row.productName) },
      { key: 'sku', header: 'SKU', render: (row) => String(row.sku), hideOnMobile: true },
      { key: 'currentStock', header: 'Qty', render: (row) => String(row.currentStock) },
      { key: 'daysSinceLastSale', header: 'Days Since Sale', render: (row) => String(row.daysSinceLastSale) },
      { key: 'lastSaleDate', header: 'Last Sale', render: (row) => row.lastSaleDate ? formatDate(row.lastSaleDate as string) : 'Never' },
      { key: 'totalValue', header: 'Value', render: (row) => <Amount value={Number(row.totalValue)} />, hideOnMobile: true },
    ],
  },

  low_stock: {
    title: 'Low Stock Report',
    columns: [
      { key: 'productName', header: 'Product', render: (row) => String(row.productName) },
      { key: 'sku', header: 'SKU', render: (row) => String(row.sku), hideOnMobile: true },
      { key: 'currentStock', header: 'Current Qty', render: (row) => String(row.currentStock) },
      { key: 'minStockLevel', header: 'Min Level', render: (row) => String(row.minStockLevel) },
      { key: 'deficit', header: 'Deficit', render: (row) => String(row.deficit) },
      { key: 'categoryName', header: 'Category', render: (row) => String(row.categoryName), hideOnMobile: true },
    ],
  },

  dead_stock: {
    title: 'Dead Stock Report',
    columns: [
      { key: 'productName', header: 'Product', render: (row) => String(row.productName) },
      { key: 'sku', header: 'SKU', render: (row) => String(row.sku), hideOnMobile: true },
      { key: 'currentStock', header: 'Qty', render: (row) => String(row.currentStock) },
      { key: 'costPrice', header: 'Cost Price', render: (row) => <Amount value={Number(row.costPrice)} /> },
      { key: 'totalValue', header: 'Value at Cost', render: (row) => <Amount value={Number(row.totalValue)} /> },
      { key: 'daysSinceReceived', header: 'Days in Stock', render: (row) => String(row.daysSinceReceived), hideOnMobile: true },
    ],
  },

  supplier_ledger: {
    title: 'Supplier Ledger',
    columns: [
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'description', header: 'Description', render: (row) => String(row.description) },
      { key: 'referenceId', header: 'Reference', render: (row) => String(row.referenceId ?? '--'), hideOnMobile: true },
      { key: 'debit', header: 'Debit', render: (row) => row.debit ? <Amount value={Number(row.debit)} /> : <>--</> },
      { key: 'credit', header: 'Credit', render: (row) => row.credit ? <Amount value={Number(row.credit)} /> : <>--</> },
      { key: 'runningBalance', header: 'Balance', render: (row) => <Amount value={Number(row.runningBalance)} /> },
    ],
  },

  customer_ledger: {
    title: 'Customer Ledger (Khata)',
    columns: [
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'description', header: 'Description', render: (row) => String(row.description) },
      { key: 'referenceId', header: 'Reference', render: (row) => String(row.referenceId ?? '--'), hideOnMobile: true },
      { key: 'debit', header: 'Debit', render: (row) => row.debit ? <Amount value={Number(row.debit)} /> : <>--</> },
      { key: 'credit', header: 'Credit', render: (row) => row.credit ? <Amount value={Number(row.credit)} /> : <>--</> },
      { key: 'runningBalance', header: 'Balance', render: (row) => <Amount value={Number(row.runningBalance)} /> },
    ],
  },

  outstanding_payables: {
    title: 'Outstanding Payables',
    columns: [
      { key: 'supplierName', header: 'Supplier', render: (row) => String(row.supplierName) },
      { key: 'totalPurchases', header: 'Total Purchases', render: (row) => <Amount value={Number(row.totalPurchases)} /> },
      { key: 'totalPayments', header: 'Total Paid', render: (row) => <Amount value={Number(row.totalPayments)} /> },
      { key: 'outstanding', header: 'Outstanding', render: (row) => <Amount value={Number(row.outstanding)} /> },
      { key: 'lastPaymentDate', header: 'Last Payment', render: (row) => row.lastPaymentDate ? formatDate(row.lastPaymentDate as string) : 'Never', hideOnMobile: true },
      { key: 'agingDays', header: 'Aging (Days)', render: (row) => String(row.agingDays ?? '--'), hideOnMobile: true },
    ],
  },

  outstanding_receivables: {
    title: 'Outstanding Receivables',
    columns: [
      { key: 'customerName', header: 'Customer', render: (row) => String(row.customerName) },
      { key: 'phone', header: 'Phone', render: (row) => String(row.phone ?? '--'), hideOnMobile: true },
      { key: 'totalSales', header: 'Total Sales', render: (row) => <Amount value={Number(row.totalSales)} /> },
      { key: 'totalPayments', header: 'Total Paid', render: (row) => <Amount value={Number(row.totalPayments)} /> },
      { key: 'outstanding', header: 'Outstanding', render: (row) => <Amount value={Number(row.outstanding)} /> },
      { key: 'lastPaymentDate', header: 'Last Payment', render: (row) => row.lastPaymentDate ? formatDate(row.lastPaymentDate as string) : 'Never', hideOnMobile: true },
    ],
  },

  profit_loss: {
    title: 'Profit & Loss',
    columns: [
      { key: 'label', header: 'Particulars', render: (row) => String(row.label) },
      { key: 'amount', header: 'Amount', render: (row) => <Amount value={Number(row.amount)} /> },
      { key: 'percentage', header: '% of Revenue', render: (row) => row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '--' },
      { key: 'previousAmount', header: 'Previous Period', render: (row) => row.previousAmount != null ? <Amount value={Number(row.previousAmount)} /> : <>--</>, hideOnMobile: true },
      { key: 'change', header: 'Change', render: (row) => row.change != null ? `${Number(row.change).toFixed(1)}%` : '--', hideOnMobile: true },
    ],
  },

  bargain_discount: {
    title: 'Bargain Discount Report',
    columns: [
      { key: 'billNumber', header: 'Bill No', render: (row) => String(row.billNumber) },
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'customerName', header: 'Customer', render: (row) => String(row.customerName ?? 'Walk-in') },
      { key: 'subtotal', header: 'Subtotal', render: (row) => <Amount value={Number(row.subtotal)} />, hideOnMobile: true },
      { key: 'discountAmount', header: 'Discount', render: (row) => <Amount value={Number(row.discountAmount)} /> },
      { key: 'discountPct', header: 'Discount %', render: (row) => `${Number(row.discountPct).toFixed(1)}%` },
      { key: 'salesperson', header: 'Salesperson', render: (row) => String(row.salesperson ?? '--'), hideOnMobile: true },
    ],
  },

  cash_register: {
    title: 'Cash Register Report',
    columns: [
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'userName', header: 'User', render: (row) => String(row.userName) },
      { key: 'openingBalance', header: 'Opening', render: (row) => <Amount value={Number(row.openingBalance)} /> },
      { key: 'cashIn', header: 'Cash In', render: (row) => <Amount value={Number(row.cashIn)} /> },
      { key: 'cashOut', header: 'Cash Out', render: (row) => <Amount value={Number(row.cashOut)} /> },
      { key: 'closingBalance', header: 'Closing', render: (row) => <Amount value={Number(row.closingBalance)} /> },
      { key: 'discrepancy', header: 'Discrepancy', render: (row) => <Amount value={Number(row.discrepancy)} />, hideOnMobile: true },
    ],
  },

  gst_summary: {
    title: 'GST Summary',
    columns: [
      { key: 'gstRate', header: 'GST Rate', render: (row) => `${row.gstRate}%` },
      { key: 'taxableAmount', header: 'Taxable Amount', render: (row) => <Amount value={Number(row.taxableAmount)} /> },
      { key: 'cgst', header: 'CGST', render: (row) => <Amount value={Number(row.cgst)} /> },
      { key: 'sgst', header: 'SGST', render: (row) => <Amount value={Number(row.sgst)} /> },
      { key: 'igst', header: 'IGST', render: (row) => <Amount value={Number(row.igst)} />, hideOnMobile: true },
      { key: 'totalTax', header: 'Total Tax', render: (row) => <Amount value={Number(row.totalTax)} /> },
    ],
  },

  purchase_summary: {
    title: 'Purchase Summary',
    columns: [
      { key: 'supplierName', header: 'Supplier', render: (row) => String(row.supplierName) },
      { key: 'invoiceCount', header: 'Invoices', render: (row) => String(row.invoiceCount) },
      { key: 'totalAmount', header: 'Total Amount', render: (row) => <Amount value={Number(row.totalAmount)} /> },
      { key: 'totalTax', header: 'Tax', render: (row) => <Amount value={Number(row.totalTax)} /> },
      { key: 'totalPaid', header: 'Paid', render: (row) => <Amount value={Number(row.totalPaid)} />, hideOnMobile: true },
      { key: 'outstanding', header: 'Outstanding', render: (row) => <Amount value={Number(row.outstanding)} />, hideOnMobile: true },
    ],
  },

  stock_movement: {
    title: 'Stock Movement',
    columns: [
      { key: 'date', header: 'Date', render: (row) => formatDate(row.date as string) },
      { key: 'productName', header: 'Product', render: (row) => String(row.productName) },
      { key: 'sku', header: 'SKU', render: (row) => String(row.sku), hideOnMobile: true },
      { key: 'type', header: 'Type', render: (row) => String(row.type) },
      { key: 'quantityChange', header: 'Qty Change', render: (row) => {
        const val = Number(row.quantityChange)
        return <span className={val > 0 ? 'text-emerald-600' : 'text-destructive'}>{val > 0 ? `+${val}` : String(val)}</span>
      }},
      { key: 'reference', header: 'Reference', render: (row) => String(row.reference ?? '--'), hideOnMobile: true },
    ],
  },
}

function ReportViewerPage() {
  const { type } = Route.useParams()

  const config = REPORT_CONFIGS[type]
  const title = config?.title ?? type.replace(/_/g, ' ')
  const columns = config?.columns ?? []

  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  })

  const filters: Record<string, unknown> = {}
  if (dateRange.from) filters.date_from = dateRange.from.toISOString()
  if (dateRange.to) filters.date_to = dateRange.to.toISOString()

  const { data: reportData, isLoading } = useQuery({
    queryKey: queryKeys.reports.data(type, filters),
    queryFn: () => getReport(type, filters).then((res) => res.data as ReportData),
  })

  const rows = reportData?.rows ?? (Array.isArray(reportData) ? (reportData as Record<string, unknown>[]) : [])
  const summary = reportData?.summary

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link to="/reports">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
      </div>

      <ReportViewer
        title={title}
        reportType={type}
        columns={columns}
        data={rows}
        summary={summary}
        loading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </div>
  )
}
