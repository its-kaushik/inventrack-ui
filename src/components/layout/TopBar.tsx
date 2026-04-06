import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-media-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { Bell, Menu, ArrowLeft, Search, Settings, LogOut, User } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export function TopBar({
  title = 'InvenTrack',
  showBack = false,
  onBack,
  onMenuClick,
  className,
}: TopBarProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const { data: unreadCount } = useUnreadNotificationCount();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? '?';
  const canAccessSettings = user?.role === 'owner' || user?.role === 'super_admin';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center bg-white shadow-sticky',
        className,
      )}
    >
      {isMobile ? (
        /* ── Mobile Top Bar ── */
        <div className="flex w-full items-center px-4">
          <div className="flex w-10 shrink-0 items-center">
            {showBack ? (
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
                <ArrowLeft className="size-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            )}
          </div>

          <h1 className="flex-1 truncate text-center text-base font-semibold text-neutral-800">
            {title}
          </h1>

          <div className="flex w-10 shrink-0 items-center justify-end">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" onClick={() => navigate('/notifications')}>
              <Bell className="size-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                  {unreadCount! > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Desktop Top Bar ── */
        <div className="flex w-full items-center gap-4 px-6">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products, customers..."
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" onClick={() => navigate('/notifications')}>
              <Bell className="size-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                  {unreadCount! > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {/* User menu dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="User menu"
              >
                {userInitial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-neutral-800">{user?.name ?? 'User'}</p>
                  <p className="text-xs text-neutral-500 capitalize">{user?.role ?? 'unknown'}</p>
                </div>
                <DropdownMenuSeparator />
                {canAccessSettings && (
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-error-600 focus:text-error-600"
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  );
}
