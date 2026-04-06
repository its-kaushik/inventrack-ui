import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-media-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ArrowLeft, Search } from 'lucide-react';

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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center bg-white shadow-sticky',
        className
      )}
    >
      {isMobile ? (
        /* ── Mobile Top Bar ── */
        <div className="flex w-full items-center px-4">
          {/* Left action */}
          <div className="flex w-10 shrink-0 items-center">
            {showBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="size-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            )}
          </div>

          {/* Center title */}
          <h1 className="flex-1 truncate text-center text-base font-semibold text-neutral-800">
            {title}
          </h1>

          {/* Right action */}
          <div className="flex w-10 shrink-0 items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="size-5" />
              {/* Notification badge dot */}
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error-500" />
            </Button>
          </div>
        </div>
      ) : (
        /* ── Desktop Top Bar ── */
        <div className="flex w-full items-center gap-4 px-6">
          {/* Search placeholder */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products, customers..."
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error-500" />
            </Button>

            {/* User avatar placeholder */}
            <div className="flex size-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
              K
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
