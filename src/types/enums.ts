// User roles
export type Role = 'super_admin' | 'owner' | 'manager' | 'salesman';

// Tenant
export type GstScheme = 'composite' | 'regular';
export type TenantStatus = 'active' | 'suspended' | 'deleted';

// Sales
export type SaleStatus = 'completed' | 'cancelled' | 'returned' | 'partially_returned';
export type SaleChannel = 'in_store' | 'online';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';

// Purchase Orders
export type POStatus = 'draft' | 'sent' | 'partially_received' | 'fully_received' | 'cancelled';
export type ReceiptPaymentMode = 'paid' | 'credit' | 'partial';

// Inventory
export type MovementType = 'purchase' | 'sale' | 'sale_return' | 'purchase_return' | 'adjustment' | 'opening_balance';
export type AdjustmentReason = 'damage' | 'theft' | 'count_correction' | 'expired' | 'other';

// Returns
export type ReturnType = 'full' | 'partial' | 'exchange';
export type RefundMode = 'cash' | 'khata' | 'exchange' | 'store_credit';
export type ReturnReason = 'size_issue' | 'defect' | 'changed_mind' | 'color_mismatch' | 'other';

// Notifications
export type NotificationPriority = 'high' | 'medium' | 'low';

// Expenses
export type ExpensePaymentMode = 'cash' | 'upi' | 'bank_transfer';
export type SupplierPaymentTerms = 'cod' | 'net_15' | 'net_30' | 'net_60' | 'advance';
