import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type TenantListParams, type CreateTenantRequest } from '@/api/admin.api';
import { toast } from 'sonner';

export function useTenants(params?: TenantListParams) {
  return useQuery({
    queryKey: ['admin', 'tenants', params],
    queryFn: () => adminApi.listTenants(params),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['admin', 'tenants', id],
    queryFn: () => adminApi.getTenant(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantRequest) => adminApi.createTenant(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant created');
    },
    onError: () => toast.error('Failed to create tenant'),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant suspended');
    },
    onError: () => toast.error('Failed to suspend tenant'),
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reactivateTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant reactivated');
    },
    onError: () => toast.error('Failed to reactivate tenant'),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant deleted');
    },
    onError: () => toast.error('Failed to delete tenant'),
  });
}
