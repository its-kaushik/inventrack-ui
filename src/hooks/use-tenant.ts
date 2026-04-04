import { useAuthStore } from '@/stores/auth.store'

export function useTenant() {
  const tenant = useAuthStore((s) => s.tenant)
  return {
    tenant,
    tenantId: tenant?.id ?? '',
    gstScheme: tenant?.gstScheme ?? 'regular',
    settings: tenant?.settings ?? null,
    setupComplete: tenant?.setupComplete ?? false,
    invoicePrefix: tenant?.invoicePrefix ?? '',
  }
}
