import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Ban, RotateCcw, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, StatusBadge, EmptyState, ConfirmSheet } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useTenants,
  useSuspendTenant,
  useReactivateTenant,
  useDeleteTenant,
} from '@/hooks/use-admin';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { TenantDetail } from '@/api/admin.api';

const STATUS_MAP: Record<string, { status: 'green' | 'amber' | 'red'; label: string }> = {
  active: { status: 'green', label: 'Active' },
  suspended: { status: 'amber', label: 'Suspended' },
  deleted: { status: 'red', label: 'Deleted' },
};

export default function TenantListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useTenants({ search: debouncedSearch || undefined, page, limit: 20 });
  const suspendMutation = useSuspendTenant();
  const reactivateMutation = useReactivateTenant();
  const deleteMutation = useDeleteTenant();

  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'reactivate' | 'delete'; tenant: TenantDetail } | null>(null);

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, tenant } = confirmAction;
    const mutate = type === 'suspend' ? suspendMutation : type === 'reactivate' ? reactivateMutation : deleteMutation;
    mutate.mutate(tenant.id, { onSuccess: () => setConfirmAction(null) });
  };

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader
        title="Tenant Management"
        action={{ label: 'Create Tenant', onClick: () => navigate('/admin/tenants/new'), icon: Plus }}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search tenants..." />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && tenants.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No tenants"
          description={search ? 'No tenants match your search.' : 'Create your first tenant to get started.'}
          actionLabel="Create Tenant"
          onAction={() => navigate('/admin/tenants/new')}
        />
      )}

      {!isLoading && tenants.length > 0 && (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {tenants.map((tenant) => {
                const statusInfo = STATUS_MAP[tenant.status] ?? { status: 'blue' as const, label: tenant.status };
                return (
                  <Card key={tenant.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-800 truncate">{tenant.name}</p>
                          {tenant.ownerName && (
                            <p className="text-xs text-neutral-500">Owner: {tenant.ownerName}</p>
                          )}
                          <p className="mt-1 text-xs text-neutral-400">
                            {tenant.skuCount} SKUs · {tenant.transactionCount} transactions · {tenant.userCount} users
                          </p>
                          <p className="text-xs text-neutral-400">Created: {formatDate(tenant.createdAt)}</p>
                        </div>
                        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        {tenant.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'suspend', tenant })}>
                            <Ban className="size-3.5" data-icon="inline-start" /> Suspend
                          </Button>
                        )}
                        {tenant.status === 'suspended' && (
                          <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'reactivate', tenant })}>
                            <RotateCcw className="size-3.5" data-icon="inline-start" /> Reactivate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-error-200 text-error-600"
                          onClick={() => setConfirmAction({ type: 'delete', tenant })}
                        >
                          <Trash2 className="size-3.5" data-icon="inline-start" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SKUs</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => {
                    const statusInfo = STATUS_MAP[tenant.status] ?? { status: 'blue' as const, label: tenant.status };
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="text-neutral-500">{tenant.ownerName ?? '—'}</TableCell>
                        <TableCell><StatusBadge status={statusInfo.status} label={statusInfo.label} /></TableCell>
                        <TableCell>{tenant.skuCount}</TableCell>
                        <TableCell>{tenant.transactionCount}</TableCell>
                        <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {tenant.status === 'active' && (
                              <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ type: 'suspend', tenant })} title="Suspend">
                                <Ban className="size-4" />
                              </Button>
                            )}
                            {tenant.status === 'suspended' && (
                              <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ type: 'reactivate', tenant })} title="Reactivate">
                                <RotateCcw className="size-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-error-600" onClick={() => setConfirmAction({ type: 'delete', tenant })} title="Delete">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-neutral-500">Page {page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirm action sheet */}
      <ConfirmSheet
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={
          confirmAction?.type === 'suspend' ? `Suspend ${confirmAction.tenant.name}?` :
          confirmAction?.type === 'reactivate' ? `Reactivate ${confirmAction.tenant.name}?` :
          `Delete ${confirmAction?.tenant.name}?`
        }
        description={
          confirmAction?.type === 'suspend' ? 'This tenant will lose access to the system. You can reactivate later.' :
          confirmAction?.type === 'reactivate' ? 'This will restore full access for the tenant.' :
          'This action cannot be undone. All tenant data will be permanently removed.'
        }
        variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete Permanently' : confirmAction?.type === 'suspend' ? 'Suspend' : 'Reactivate'}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
