import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  type UpdateSettingsRequest,
  type UpdateTenantRequest,
  type UpdateGstRequest,
  type InviteUserRequest,
} from '@/api/settings.api';
import { toast } from 'sonner';

// ── Settings ──

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings().then((r) => r.data),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => settingsApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantRequest) => settingsApi.updateTenant(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Store profile updated');
    },
    onError: () => toast.error('Failed to update store profile'),
  });
}

// ── GST ──

export function useGstConfig() {
  return useQuery({
    queryKey: ['settings', 'gst'],
    queryFn: () => settingsApi.getGstConfig().then((r) => r.data),
  });
}

export function useUpdateGstConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGstRequest) => settingsApi.updateGstConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'gst'] });
      toast.success('GST settings updated');
    },
    onError: () => toast.error('Failed to update GST settings'),
  });
}

// ── Users ──

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => settingsApi.getUsers().then((r) => r.data),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteUserRequest) => settingsApi.inviteUser(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invite sent successfully');
      return res.data;
    },
    onError: () => toast.error('Failed to send invite'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<import('@/types/models').User, 'name' | 'role' | 'isActive'>>) =>
      settingsApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsApi.deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
    },
    onError: () => toast.error('Failed to deactivate user'),
  });
}
