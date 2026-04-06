import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useIsMobile, useIsDesktop } from '@/hooks/use-media-query';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

// Map route paths to page titles for the mobile top bar
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/suppliers': 'Suppliers',
  '/customers': 'Customers',
  '/credit': 'Credit / Khata',
  '/purchases': 'Purchase Orders',
  '/reports': 'Reports',
  '/expenses': 'Expenses',
  '/settings': 'Settings',
  '/settings/gst': 'GST Settings',
  '/settings/users': 'User Management',
  '/settings/pin': 'PIN Setup',
};

export function AppShell() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? 'salesman';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  // Determine page title from current path
  const title = PAGE_TITLES[location.pathname] ?? 'InvenTrack';

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Desktop: Sidebar ── */}
      {isDesktop && (
        <Sidebar
          currentRole={role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        />
      )}

      {/* ── Top Bar ── */}
      <div
        className={cn(isDesktop && 'transition-[margin-left] duration-200')}
        style={isDesktop ? { marginLeft: sidebarWidth } : undefined}
      >
        <TopBar title={title} />
      </div>

      {/* ── Main Content ── */}
      <main
        className={cn(
          'min-h-[calc(100dvh-3.5rem)]',
          isMobile && 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
          isDesktop && 'transition-[margin-left] duration-200',
        )}
        style={isDesktop ? { marginLeft: sidebarWidth } : undefined}
      >
        <Outlet />
      </main>

      {/* ── Mobile: Bottom Nav ── */}
      {isMobile && <BottomNav currentRole={role} />}
    </div>
  );
}
