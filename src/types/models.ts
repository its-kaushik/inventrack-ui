import type {
  UserRole,
  BillStatus,
  PaymentMode,
  GstScheme,
  StockStatus,
  CashRegisterStatus,
} from './enums'

export interface Tenant {
  id: string
  name: string
  gstScheme: GstScheme
  gstin: string | null
  invoicePrefix: string
  settings: TenantSettings
  setupComplete: boolean
}

export interface TenantSettings {
  low_stock_default_threshold: number
  aging_threshold_days: number
  return_window_days: number
  max_salesperson_discount_amount: number
  max_salesperson_discount_percent: number
  receipt_footer_text: string
  receipt_header_text: string
  label_template_id: string
}

export interface User {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string | null
  role: UserRole
  isActive?: boolean
  setupComplete?: boolean
  tenant?: Tenant
}

export interface Category {
  id: string
  name: string
  code: string
  sortOrder: number
  isActive: boolean
}

export interface SubType {
  id: string
  categoryId: string
  name: string
  code: string
}

export interface SizeSystem {
  id: string
  name: string
  values: string[]
}

export interface Brand {
  id: string
  name: string
  code: string
}

export interface Product {
  id: string
  tenantId: string
  name: string
  sku: string
  barcode: string
  categoryId: string
  subTypeId: string | null
  brandId: string | null
  size: string | null
  color: string | null
  hsnCode: string | null
  gstRate: number
  sellingPrice: number
  costPrice: number
  mrp: number | null
  catalogDiscountPct: number
  minStockLevel: number
  reorderPoint: number | null
  description: string | null
  imageUrls: string[]
  isActive: boolean
  currentStock?: number
  createdAt: string
  updatedAt: string
}

export interface ProductSnapshot {
  name: string
  sku: string
  size: string | null
  sellingPrice: number
  catalogDiscountPct: number
  gstRate: number
}

export interface Bill {
  id: string
  tenantId: string
  billNumber: string
  customerId: string | null
  salespersonId: string
  subtotal: string
  catalogDiscountTotal: string
  additionalDiscountAmount: string
  taxAmount: string
  netAmount: string
  gstSchemeAtSale: GstScheme
  status: BillStatus
  notes: string | null
  createdAt: string
  items?: BillItem[]
  payments?: BillPayment[]
  customer?: Customer
}

export interface BillItem {
  id: string
  billId: string
  productId: string
  productName: string
  sku: string
  size: string | null
  quantity: number
  unitPrice: string
  catalogDiscountPct: number
  lineTotal: string
  gstRate: number
  gstAmount: string
}

export interface BillPayment {
  id: string
  billId: string
  mode: PaymentMode
  amount: string
  reference: string | null
}

export interface Customer {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string | null
  address: string | null
  outstandingBalance?: string
  createdAt: string
}

export interface Supplier {
  id: string
  tenantId: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  gstin: string | null
  paymentTerms: string | null
  notes: string | null
  outstandingBalance?: string
  createdAt: string
}

export interface LedgerEntry {
  id: string
  date: string
  description: string
  debit: string | null
  credit: string | null
  runningBalance: string
  type: string
  referenceId: string | null
}

export interface Purchase {
  id: string
  tenantId: string
  supplierId: string
  invoiceNumber: string | null
  invoiceDate: string | null
  invoiceImageUrl: string | null
  totalAmount: string
  cgstAmount: string | null
  sgstAmount: string | null
  igstAmount: string | null
  isRcm: boolean
  createdAt: string
  items?: PurchaseItem[]
  supplier?: Supplier
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string
  quantity: number
  costPrice: string
  gstRate: number
  gstAmount: string | null
}

export interface StockItem {
  id: string
  name: string
  sku: string
  currentStock: number
  minStockLevel: number
  status: StockStatus
}

export interface StockSummary {
  total: number
  inStock: number
  low: number
  out: number
}

export interface CashRegister {
  id: string
  userId: string
  openingBalance: string
  calculatedClosing: string | null
  actualClosing: string | null
  discrepancy: string | null
  status: CashRegisterStatus
  entries?: CashRegisterEntry[]
  currentBalance?: string
  openedAt: string
  closedAt: string | null
}

export interface CashRegisterEntry {
  id: string
  registerId: string
  type: string
  amount: string
  description: string
  referenceId: string | null
  createdAt: string
}

export interface DashboardData {
  todaySales: { total: number; count: number; yesterdayTotal: number }
  outstandingReceivables: number
  outstandingPayables: number
  lowStockCount: number
  recentBills: Bill[]
  paymentModeSplit: { cash: number; upi: number; card: number }
  todayProfit?: number
  cashInHand?: number
  agingInventoryCount?: number
  topSellers?: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  supplierPaymentsDue?: Array<{
    supplierId: string
    supplierName: string
    amount: number
    dueDate: string
  }>
}

export interface SalespersonDashboardData {
  mySalesToday: { total: number; count: number }
  recentMyBills: Bill[]
}

export interface LabelItem {
  productName: string
  sku: string
  barcode: string
  size: string | null
  sellingPrice: string
  quantity: number
  barcodeDataUrl: string
}
