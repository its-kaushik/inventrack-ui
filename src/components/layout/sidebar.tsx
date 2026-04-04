import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Factory,
  Users,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Receipt,
  Banknote,
  TrendingUp,
  FileText,
  ScrollText,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  ownerOnly?: boolean
  roles: Array<'owner' | 'manager' | 'salesperson'>
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    roles: ['owner', 'manager', 'salesperson'],
  },
  {
    label: 'POS',
    icon: ShoppingCart,
    href: '/pos',
    roles: ['owner', 'manager', 'salesperson'],
  },
  {
    label: 'Inventory',
    icon: Package,
    href: '/inventory/products',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Products',
    icon: Package,
    href: '/inventory/products',
    roles: ['salesperson'],
  },
  {
    label: 'Purchases',
    icon: Truck,
    href: '/purchases/receive',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Suppliers',
    icon: Factory,
    href: '/suppliers',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Customers',
    icon: Users,
    href: '/customers',
    roles: ['owner', 'manager', 'salesperson'],
  },
  {
    label: 'Accounting',
    icon: Calculator,
    href: '/accounting/cash',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Sales Overview',
    icon: BarChart3,
    href: '/accounting/sales',
    roles: ['owner', 'manager'],
  },
  {
    label: 'GST',
    icon: Receipt,
    href: '/accounting/gst',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Expenses',
    icon: Banknote,
    href: '/accounting/expenses',
    roles: ['owner', 'manager'],
  },
  {
    label: 'P&L',
    icon: TrendingUp,
    href: '/accounting/pnl',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Reports',
    icon: FileText,
    href: '/reports',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Audit Log',
    icon: ScrollText,
    href: '/audit',
    roles: ['owner'],
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    roles: ['owner'],
  },
]

export function Sidebar() {
  const { role } = useRole()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const filteredItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        'flex h-dvh flex-col bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo + Notification Bell */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-foreground/10 px-4',
          collapsed ? 'justify-center px-2' : 'justify-between'
        )}
      >
        {collapsed ? (
          <span className="text-lg font-bold">IT</span>
        ) : (
          <span className="text-lg font-bold tracking-tight">InvenTrack</span>
        )}
        {!collapsed && (
          <Link to="/notifications" className="relative">
            <Bell className="size-5 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <TooltipProvider>
          <ul className="flex flex-col gap-0.5 px-2">
            {filteredItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              const Icon = item.icon

              const linkContent = (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-sidebar-foreground/10',
                    isActive &&
                      'bg-sidebar-foreground/15 text-sidebar-foreground',
                    !isActive && 'text-sidebar-foreground/70',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <li key={item.href + item.label}>
                    <Tooltip>
                      <TooltipTrigger render={<div />}>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )
              }

              return <li key={item.href + item.label}>{linkContent}</li>
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Bottom: User info + collapse toggle */}
      <div className="border-t border-sidebar-foreground/10 p-3">
        {!collapsed && user && (
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground/20 text-xs font-semibold uppercase">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <Badge variant="secondary" className="mt-0.5 text-[10px] capitalize">
                {role}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={toggleSidebar}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground',
            !collapsed && 'justify-start gap-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
