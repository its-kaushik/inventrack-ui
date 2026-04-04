import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/enums'

export function useRole() {
  const role = useAuthStore((s) => s.user?.role ?? 'salesperson') as UserRole
  return {
    role,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isSalesperson: role === 'salesperson',
    canViewCostPrice: role !== 'salesperson',
    canProcessReturn: role !== 'salesperson',
    canManageSettings: role === 'owner',
    canManageUsers: role === 'owner',
    canManageStock: role !== 'salesperson',
    canViewPnL: role === 'owner',
    canDeleteProducts: role === 'owner',
    canManageProducts: role !== 'salesperson',
  }
}
