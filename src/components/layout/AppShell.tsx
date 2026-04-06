import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useIsMobile, useIsDesktop } from '@/hooks/use-media-query';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import type { Role } from '@/types/enums';

interface AppShellProps {
  /** Override page title in mobile top bar */
  title?: string;
  /** Current user role — defaults to 'owner' until auth context in F3 */
  currentRole?: Role;
  children?: React.ReactNode;
}

export function AppShell({
  title = 'InvenTrack',
  currentRole = 'owner',
  children,
}: AppShellProps) {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, _setSidebarCollapsed] = useState(false);

  // The sidebar internally manages its own collapsed state.
  // We track it here only for content margin calculation.
  // For now, the sidebar uses its own internal state; we just read the default.
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Desktop: Sidebar ── */}
      {isDesktop && <Sidebar currentRole={currentRole} />}

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
          // Mobile: leave room for bottom nav (64px + safe area)
          isMobile && 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]',
          // Desktop: offset for sidebar
          isDesktop && 'transition-[margin-left] duration-200'
        )}
        style={isDesktop ? { marginLeft: sidebarWidth } : undefined}
      >
        {children ?? <Outlet />}
      </main>

      {/* ── Mobile: Bottom Nav ── */}
      {isMobile && <BottomNav currentRole={currentRole} />}
    </div>
  );
}
