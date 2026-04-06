import { useState } from 'react';
import { cn } from '@/lib/cn';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getBottomNavItems } from '@/config/navigation';
import type { Role } from '@/types/enums';

interface BottomNavProps {
  currentRole?: Role;
  className?: string;
}

export function BottomNav({ currentRole = 'owner', className }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pinned, overflow } = getBottomNavItems(currentRole);

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white',
          'pb-[env(safe-area-inset-bottom,0px)]',
          className
        )}
      >
        <div className="flex h-16 items-stretch">
          {pinned.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary-600'
                    : 'text-neutral-400 active:text-neutral-600'
                )
              }
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* More button */}
          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                moreOpen
                  ? 'text-primary-600'
                  : 'text-neutral-400 active:text-neutral-600'
              )}
            >
              <Menu className="size-5" />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── "More" bottom sheet ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom,0px)]">
          <SheetHeader className="px-4">
            <div className="flex items-center justify-between">
              <SheetTitle>More</SheetTitle>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {overflow.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  )
                }
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-100">
                  <item.icon className="size-5" />
                </div>
                <span className="text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
