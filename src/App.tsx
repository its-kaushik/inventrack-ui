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

// ── Placeholder pages for future milestones (lazy loaded) ──
const DashboardPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Dashboard" milestone="F14" /> })));
const ProductListPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Products" milestone="F5" /> })));
const SupplierListPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Suppliers" milestone="F7" /> })));
const CustomerListPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Customers" milestone="F9" /> })));
const CreditPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Credit / Khata" milestone="F11" /> })));
const PurchasesPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Purchase Orders" milestone="F8" /> })));
const ReportsPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Reports" milestone="F21" /> })));
const ExpensesPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Expenses" milestone="F12" /> })));
const SettingsPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Settings" milestone="F4" /> })));
const POSPage = lazy(() => import('@/features/placeholder/PlaceholderPage').then((m) => ({ default: () => <m.default title="Point of Sale" milestone="F10" /> })));

// ── Layout components ──
import { AppShell } from '@/components/layout';
import { POSLayout } from '@/components/layout';

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
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<SkeletonPage />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Products — all roles */}
          <Route
            path="/products"
            element={
              <Suspense fallback={<SkeletonPage />}>
                <ProductListPage />
              </Suspense>
            }
          />

          {/* Suppliers — all roles (view), manager+ (edit) */}
          <Route
            path="/suppliers"
            element={
              <Suspense fallback={<SkeletonPage />}>
                <SupplierListPage />
              </Suspense>
            }
          />

          {/* Customers — all roles */}
          <Route
            path="/customers"
            element={
              <Suspense fallback={<SkeletonPage />}>
                <CustomerListPage />
              </Suspense>
            }
          />

          {/* Credit/Khata — manager, owner, super_admin */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route
              path="/credit"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <CreditPage />
                </Suspense>
              }
            />
          </Route>

          {/* Purchases — manager, owner, super_admin */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route
              path="/purchases"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <PurchasesPage />
                </Suspense>
              }
            />
          </Route>

          {/* Reports — manager, owner, super_admin */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route
              path="/reports"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <ReportsPage />
                </Suspense>
              }
            />
          </Route>

          {/* Expenses — manager, owner, super_admin */}
          <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
            <Route
              path="/expenses"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <ExpensesPage />
                </Suspense>
              }
            />
          </Route>

          {/* Settings — owner, super_admin */}
          <Route element={<RoleGuard roles={['super_admin', 'owner']} />}>
            <Route
              path="/settings"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* ── POS routes (dedicated full-screen layout) ── */}
        <Route element={<RoleGuard roles={['super_admin', 'owner', 'manager']} />}>
          <Route element={<POSLayout />}>
            <Route
              path="/pos"
              element={
                <Suspense fallback={<SkeletonPage />}>
                  <POSPage />
                </Suspense>
              }
            />
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
