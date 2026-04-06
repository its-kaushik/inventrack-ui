import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Truck,
  Building2,
  Users,
  Wallet,
  BarChart3,
  Receipt,
  Settings,
} from 'lucide-react';
import type { Role } from '@/types/enums';

// ── Types ──

export type NavGroup = 'main' | 'inventory' | 'sales' | 'finance' | 'bottom';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Roles that can see this item */
  roles: Role[];
  /** Sidebar section group */
  group: NavGroup;
  /** If true, show in bottom nav for the given roles */
  bottomNav?: boolean;
  /** Bottom nav order per role (lower = further left). Undefined = not in bottom nav */
  bottomNavOrder?: Partial<Record<Role, number>>;
}

// ── Navigation Items ──

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutGrid,
    roles: ['super_admin', 'owner', 'manager', 'salesman'],
    group: 'main',
    bottomNav: true,
    bottomNavOrder: { owner: 1, manager: 1, salesman: 1 },
  },
  {
    label: 'POS',
    path: '/pos',
    icon: ShoppingCart,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'main',
    bottomNav: true,
    bottomNavOrder: { owner: 2, manager: 2 },
  },
  {
    label: 'Products',
    path: '/products',
    icon: Package,
    roles: ['super_admin', 'owner', 'manager', 'salesman'],
    group: 'inventory',
    bottomNav: true,
    bottomNavOrder: { owner: 3, manager: 3, salesman: 2 },
  },
  {
    label: 'Purchase Orders',
    path: '/purchases',
    icon: Truck,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'inventory',
  },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: Building2,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'inventory',
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: Users,
    roles: ['super_admin', 'owner', 'manager', 'salesman'],
    group: 'sales',
    bottomNav: true,
    bottomNavOrder: { salesman: 3 },
  },
  {
    label: 'Credit / Khata',
    path: '/credit',
    icon: Wallet,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'sales',
    bottomNav: true,
    bottomNavOrder: { owner: 4, manager: 4 },
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'finance',
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: Receipt,
    roles: ['super_admin', 'owner', 'manager'],
    group: 'finance',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['super_admin', 'owner', 'manager', 'salesman'],
    group: 'bottom',
  },
];

// ── Selectors ──

/** Get the bottom nav items for a role (up to 4 pinned + "More" is handled in the component) */
export function getBottomNavItems(role: Role) {
  // Items that have a bottomNavOrder for this role, sorted by that order
  const pinned = navigationItems
    .filter(
      (item) =>
        item.roles.includes(role) &&
        item.bottomNavOrder?.[role] !== undefined
    )
    .sort(
      (a, b) =>
        (a.bottomNavOrder?.[role] ?? 99) - (b.bottomNavOrder?.[role] ?? 99)
    );

  // Items accessible to this role but NOT pinned in bottom nav → overflow / "More" sheet
  const overflow = navigationItems.filter(
    (item) =>
      item.roles.includes(role) &&
      item.bottomNavOrder?.[role] === undefined
  );

  return { pinned, overflow };
}

/** Get sidebar-grouped items for a role */
export function getSidebarItems(role: Role) {
  const items = navigationItems.filter((item) => item.roles.includes(role));

  const groups: { label: string; key: NavGroup; items: NavItem[] }[] = [
    { label: 'MAIN', key: 'main', items: [] },
    { label: 'INVENTORY', key: 'inventory', items: [] },
    { label: 'SALES', key: 'sales', items: [] },
    { label: 'FINANCE', key: 'finance', items: [] },
  ];

  for (const item of items) {
    const group = groups.find((g) => g.key === item.group);
    if (group) {
      group.items.push(item);
    }
  }

  // Filter out empty groups
  const populated = groups.filter((g) => g.items.length > 0);

  // Bottom items (Settings, etc.)
  const bottomItems = items.filter((item) => item.group === 'bottom');

  return { groups: populated, bottomItems };
}
