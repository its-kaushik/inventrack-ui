import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { OnlineStatusProvider } from '@/components/providers/OnlineStatusProvider';
import { AuthGuard, RoleGuard } from '@/components/providers/AuthProvider';
import { SkeletonPage } from '@/components/shared';

// ── Auth pages (eagerly loaded — small and needed immediately) ──
import LoginPage from '@/features/auth/LoginPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import StaffSignupPage from '@/features/auth/StaffSignupPage';

// ── Settings pages (F4 — lazy loaded) ──
const StoreSettingsPage = lazy(() => import('@/features/settings/StoreSettingsPage'));
const GstSettingsPage = lazy(() => import('@/features/settings/GstSettingsPage'));
const UserManagementPage = lazy(() => import('@/features/settings/UserManagementPage'));
const PinSetupPage = lazy(() => import('@/features/settings/PinSetupPage'));

// ── Product pages (F5 — lazy loaded) ──
const ProductListPage = lazy(() => import('@/features/products/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/products/ProductDetailPage'));
const ProductFormPage = lazy(() => import('@/features/products/ProductFormPage'));
const BulkImportPage = lazy(() => import('@/features/products/BulkImportPage'));

// ── Inventory pages (F6 — lazy loaded) ──
const StockAdjustmentPage = lazy(() => import('@/features/products/StockAdjustmentPage'));
const StockMovementPage = lazy(() => import('@/features/products/StockMovementPage'));
const StockCountPage = lazy(() => import('@/features/products/StockCountPage'));

// ── Supplier pages (F7 — lazy loaded) ──
const SupplierListPage = lazy(() => import('@/features/purchases/SupplierListPage'));
const SupplierDetailPage = lazy(() => import('@/features/purchases/SupplierDetailPage'));
const SupplierFormPage = lazy(() => import('@/features/purchases/SupplierFormPage'));

// ── Purchase pages (F8 — lazy loaded) ──
const GoodsReceiptPage = lazy(() => import('@/features/purchases/GoodsReceiptPage'));
const PurchaseReturnPage = lazy(() => import('@/features/purchases/PurchaseReturnPage'));

// ── Customer pages (F9 — lazy loaded) ──
const CustomerListPage = lazy(() => import('@/features/customers/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('@/features/customers/CustomerDetailPage'));
const CustomerFormPage = lazy(() => import('@/features/customers/CustomerFormPage'));

// ── POS pages (F10 — lazy loaded) ──
const POSPage = lazy(() => import('@/features/pos/POSPage'));
const PaymentPage = lazy(() => import('@/features/pos/PaymentPage'));
const ReceiptPage = lazy(() => import('@/features/pos/ReceiptPage'));
const BillLookupPage = lazy(() => import('@/features/pos/BillLookupPage'));
const ParkedBillsPage = lazy(() => import('@/features/pos/ParkedBillsPage'));

// ── Placeholder pages for future milestones (lazy loaded) ──
const DashboardPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Dashboard" milestone="F14" /> })));
const CreditPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Credit / Khata" milestone="F11" /> })));
const PurchasesPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Purchase Orders" milestone="F8" /> })));
const ReportsPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Reports" milestone="F21" /> })));
const ExpensesPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Expenses" milestone="F12" /> })));

// ── Layout components ──
import { AppShell, POSLayout } from '@/components/layout';

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SkeletonPage />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes (no auth) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/signup/:inviteToken" element={<StaffSignupPage />} />

      {/* ── Protected routes (with AppShell layout) ── */}
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard — all roles */}
          <Route path="/dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />

          {/* Products — all roles can view, owner/manager can create/edit */}
          <Route path="/products" element={<LazyPage><ProductListPage /></LazyPage>} />
          <Route path="/products/:id" element={<LazyPage><ProductDetailPage /></LazyPage>} />
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/products/new" element={<LazyPage><ProductFormPage /></LazyPage>} />
            <Route path="/products/:id/edit" element={<LazyPage><ProductFormPage /></LazyPage>} />
            <Route path="/products/import" element={<LazyPage><BulkImportPage /></LazyPage>} />
            <Route path="/products/stock-adjust" element={<LazyPage><StockAdjustmentPage /></LazyPage>} />
            <Route path="/products/stock-count" element={<LazyPage><StockCountPage /></LazyPage>} />
          </Route>
          <Route path="/products/:productId/variants/:variantId/movements" element={<LazyPage><StockMovementPage /></LazyPage>} />

          {/* Suppliers — all roles can view, manager+ can create/edit */}
          <Route path="/suppliers" element={<LazyPage><SupplierListPage /></LazyPage>} />
          <Route path="/suppliers/:id" element={<LazyPage><SupplierDetailPage /></LazyPage>} />
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/suppliers/new" element={<LazyPage><SupplierFormPage /></LazyPage>} />
            <Route path="/suppliers/:id/edit" element={<LazyPage><SupplierFormPage /></LazyPage>} />
          </Route>

          {/* Customers — all roles */}
          <Route path="/customers" element={<LazyPage><CustomerListPage /></LazyPage>} />
          <Route path="/customers/:id" element={<LazyPage><CustomerDetailPage /></LazyPage>} />
          <Route path="/customers/new" element={<LazyPage><CustomerFormPage /></LazyPage>} />
          <Route path="/customers/:id/edit" element={<LazyPage><CustomerFormPage /></LazyPage>} />

          {/* Credit/Khata — manager+ */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/credit" element={<LazyPage><CreditPage /></LazyPage>} />
          </Route>

          {/* Purchases — manager+ */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/purchases" element={<LazyPage><PurchasesPage /></LazyPage>} />
            <Route path="/purchases/receive" element={<LazyPage><GoodsReceiptPage /></LazyPage>} />
            <Route path="/purchases/return" element={<LazyPage><PurchaseReturnPage /></LazyPage>} />
          </Route>

          {/* Reports — manager+ */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/reports" element={<LazyPage><ReportsPage /></LazyPage>} />
          </Route>

          {/* Expenses — manager+ */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/expenses" element={<LazyPage><ExpensesPage /></LazyPage>} />
          </Route>

          {/* Settings — role-gated sub-pages */}
          <Route element={<RoleGuard roles={['super_admin', 'owner']} />}>
            <Route path="/settings" element={<LazyPage><StoreSettingsPage /></LazyPage>} />
            <Route path="/settings/gst" element={<LazyPage><GstSettingsPage /></LazyPage>} />
            <Route path="/settings/pin" element={<LazyPage><PinSetupPage /></LazyPage>} />
          </Route>
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route path="/settings/users" element={<LazyPage><UserManagementPage /></LazyPage>} />
          </Route>
        </Route>

        {/* ── POS routes (dedicated full-screen layout) ── */}
        <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
          <Route element={<POSLayout />}>
            <Route path="/pos" element={<LazyPage><POSPage /></LazyPage>} />
            <Route path="/pos/payment" element={<LazyPage><PaymentPage /></LazyPage>} />
            <Route path="/pos/receipt/:saleId" element={<LazyPage><ReceiptPage /></LazyPage>} />
            <Route path="/pos/bills" element={<LazyPage><BillLookupPage /></LazyPage>} />
            <Route path="/pos/parked" element={<LazyPage><ParkedBillsPage /></LazyPage>} />
          </Route>
        </Route>
      </Route>

      {/* ── Catch-all → login ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <OnlineStatusProvider>
          <AppRoutes />
          <ToastProvider />
        </OnlineStatusProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;
