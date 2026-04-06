import type {
  Role, GstScheme, TenantStatus, SaleStatus, SaleChannel,
  PaymentMethod, POStatus, ReceiptPaymentMode, MovementType,
  NotificationPriority, ExpensePaymentMode, SupplierPaymentTerms,
} from './enums';

// ── Tenant ──
export interface Tenant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  logoUrl: string | null;
  gstScheme: GstScheme;
  currency: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  defaultBillDiscountPct: string;
  maxDiscountPct: string;
  returnWindowDays: number;
  shelfAgingThresholdDays: number;
  billNumberPrefix: string;
  receiptFooterMessage: string;
  receiptShowReturnPolicy: boolean;
  voidWindowHours: number;
}

// ── User ──
export interface User {
  id: string;
  tenantId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// ── Product ──
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  brandId: string | null;
  categoryId: string;
  hsnCode: string | null;
  description: string | null;
  hasVariants: boolean;
  defaultCostPrice: string | null;
  defaultMrp: string | null;
  gstRate: string | null;
  productDiscountPct: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  barcode: string;
  costPrice: string;
  weightedAvgCost: string;
  mrp: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number | null;
  version: number;
  isActive: boolean;
  attributes?: Record<string, string>;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

export interface Brand {
  id: string;
  tenantId: string;
  name: string;
}

// ── Supplier ──
export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  pan: string | null;
  paymentTerms: SupplierPaymentTerms;
  outstandingBalance: string;
  isActive: boolean;
}

// ── Customer ──
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  outstandingBalance: string;
  totalSpend: string;
  visitCount: number;
  lastVisitAt: string | null;
}

// ── Sale ──
export interface Sale {
  id: string;
  tenantId: string;
  billNumber: string;
  customerId: string;
  subtotalMrp: string;
  productDiscountTotal: string;
  billDiscountPct: string;
  billDiscountAmount: string;
  bargainAdjustment: string;
  effectiveDiscountPct: string;
  subtotalTaxable: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  roundOff: string;
  netPayable: string;
  totalCogs: string;
  status: SaleStatus;
  channel: SaleChannel;
  gstScheme: string;
  billedBy: string;
  clientId: string | null;
  isOffline: boolean;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  variantId: string | null;
  productName: string;
  variantDescription: string | null;
  quantity: number;
  mrp: string;
  productDiscountPct: string;
  unitPrice: string;
  lineTotal: string;
  costAtSale: string;
  hsnCode: string | null;
  gstRate: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
}

export interface SalePayment {
  id: string;
  saleId: string;
  paymentMethod: PaymentMethod;
  amount: string;
}

// ── Notification ──
export interface Notification {
  id: string;
  tenantId: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
}
