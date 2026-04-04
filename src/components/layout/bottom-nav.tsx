import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Menu,
  Truck,
  Factory,
  Calculator,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface TabItem {
  label: string
  icon: LucideIcon
  href: string
}

interface MoreItem {
  label: string
  icon: LucideIcon
  href: string
}

function getTabsForRole(role: string): { tabs: TabItem[]; moreItems: MoreItem[] } {
  if (role === 'salesperson') {
    return {
      tabs: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { label: 'Products', icon: Package, href: '/inventory/products' },
        { label: 'POS', icon: ShoppingCart, href: '/pos' },
        { label: 'Customers', icon: Users, href: '/customers' },
      ],
      moreItems: [],
    }
  }

  // Owner / Manager
  return {
    tabs: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { label: 'Inventory', icon: Package, href: '/inventory/products' },
      { label: 'POS', icon: ShoppingCart, href: '/pos' },
      { label: 'Customers', icon: Users, href: '/customers' },
    ],
    moreItems: [
      { label: 'Purchases', icon: Truck, href: '/purchases/receive' },
      { label: 'Suppliers', icon: Factory, href: '/suppliers' },
      { label: 'Accounting', icon: Calculator, href: '/accounting/cash' },
      ...(role === 'owner'
        ? [{ label: 'Settings', icon: Settings, href: '/settings' }]
        : []),
    ],
  }
}

export function BottomNav() {
  const { role } = useRole()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const [moreOpen, setMoreOpen] = useState(false)

  const { tabs, moreItems } = getTabsForRole(role)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  // Insert the POS tab at index 2 (center) — it's already at index 2 in the array
  const hasMore = moreItems.length > 0

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-sm">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          const isPosTab = index === 2

          if (isPosTab) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <div
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full shadow-md',
                    'bg-primary text-primary-foreground',
                    active && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-medium text-primary">
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 px-2"
            >
              <Icon
                className={cn(
                  'size-5',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}

        {hasMore && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2"
          >
            <Menu className="size-5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">
              More
            </span>
          </button>
        )}
      </nav>

      {hasMore && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <nav className="grid grid-cols-3 gap-4 px-4 pb-4">
              {moreItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <Icon className="size-6 text-muted-foreground" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
