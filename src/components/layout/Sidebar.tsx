import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { getSidebarItems } from '@/config/navigation';
import type { Role } from '@/types/enums';

interface SidebarProps {
  currentRole?: Role;
  className?: string;
}

export function Sidebar({ currentRole = 'owner', className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { groups, bottomItems } = getSidebarItems(currentRole);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* ── Logo area ── */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {collapsed ? (
          <span className="mx-auto text-lg font-bold text-white">IT</span>
        ) : (
          <span className="text-lg font-bold text-white">InvenTrack</span>
        )}
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {groups.map((group) => (
          <div key={group.key} className="mb-4">
            {/* Section header */}
            {!collapsed && (
              <span className="mb-1 block px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </span>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom items (Settings, Logout) ── */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <ul className="space-y-0.5">
          {bottomItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}

          {/* Logout button (not a NavLink) */}
          <li>
            <button
              type="button"
              onClick={() => {
                // TODO: implement logout in F3 (auth context)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="size-5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* ── Collapse toggle ── */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            'w-full text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
