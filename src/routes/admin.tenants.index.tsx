import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listTenants } from '@/api/admin.api'
import type { TenantInfo } from '@/types/models'
import type { TenantStatus, SubscriptionPlan } from '@/types/enums'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { StatusBadge } from '@/components/data/status-badge'
import { SearchInput } from '@/components/form/search-input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, formatRelative } from '@/lib/format-date'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/admin/tenants/')({
  component: TenantListPage,
})

const STATUS_VARIANT: Record<TenantStatus, 'success' | 'info' | 'error' | 'warning'> = {
  active: 'success',
  trial: 'info',
  suspended: 'error',
  expired: 'warning',
}

const PLAN_VARIANT: Record<SubscriptionPlan, 'default' | 'info' | 'warning'> = {
  free: 'default',
  basic: 'info',
  pro: 'warning',
}

const STATUS_OPTIONS = [
  { value: '_all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
]

const PLAN_OPTIONS = [
  { value: '_all', label: 'All Plans' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
]

function TenantListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('_all')
  const [planFilter, setPlanFilter] = useState('_all')
  const [offset, setOffset] = useState(0)
  const limit = 25

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter !== '_all' ? statusFilter : undefined,
      plan: planFilter !== '_all' ? planFilter : undefined,
      limit,
      offset,
    }),
    [search, statusFilter, planFilter, offset],
  )

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: queryKeys.admin.tenants.list(filters as Record<string, unknown>),
    queryFn: () => listTenants(filters).then((res) => res.data),
  })

  const tenants = tenantsData?.items ?? []
  const hasMore = tenantsData?.hasMore ?? false

  const handleRowClick = useCallback(
    (tenant: TenantInfo) => {
      navigate({ to: '/admin/tenants/$id', params: { id: tenant.id } })
    },
    [navigate],
  )

  const columns: Column<TenantInfo>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Store Name',
        sortable: true,
        render: (t) => <span className="font-medium">{t.name}</span>,
      },
      {
        key: 'ownerName',
        header: 'Owner',
        hideOnMobile: true,
        render: (t) => (
          <div>
            <p className="text-sm">{t.ownerName}</p>
            <p className="text-xs text-muted-foreground">{t.ownerPhone}</p>
          </div>
        ),
      },
      {
        key: 'plan',
        header: 'Plan',
        render: (t) => (
          <StatusBadge variant={PLAN_VARIANT[t.plan]}>
            {t.plan}
          </StatusBadge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (t) => (
          <StatusBadge variant={STATUS_VARIANT[t.status]}>
            {t.status}
          </StatusBadge>
        ),
      },
      {
        key: 'users',
        header: 'Users',
        hideOnMobile: true,
        className: 'text-right',
        render: (t) => <span className="tabular-nums">{t.userCount}</span>,
      },
      {
        key: 'products',
        header: 'Products',
        hideOnMobile: true,
        className: 'text-right',
        render: (t) => <span className="tabular-nums">{t.productCount}</span>,
      },
      {
        key: 'bills',
        header: 'Bills',
        hideOnMobile: true,
        className: 'text-right',
        render: (t) => <span className="tabular-nums">{t.billCount}</span>,
      },
      {
        key: 'lastActive',
        header: 'Last Active',
        hideOnMobile: true,
        render: (t) => (
          <span className="text-xs text-muted-foreground">
            {t.lastActiveAt ? formatRelative(t.lastActiveAt) : 'Never'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        hideOnMobile: true,
        render: (t) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(t.createdAt)}
          </span>
        ),
      },
    ],
    [],
  )

  const mobileCard = useCallback(
    (tenant: TenantInfo) => (
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">
                {tenant.ownerName} &middot; {tenant.userCount} users
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge variant={PLAN_VARIANT[tenant.plan]}>
                {tenant.plan}
              </StatusBadge>
              <StatusBadge variant={STATUS_VARIANT[tenant.status]}>
                {tenant.status}
              </StatusBadge>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              Total: {tenants.length}{hasMore ? '+' : ''} tenants
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setOffset(0) }}
          placeholder="Search by name, owner..."
          className="w-full sm:max-w-xs"
        />

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? '_all'); setOffset(0) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v ?? '_all'); setOffset(0) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {tenants.length === 0 && !isLoading && !search && statusFilter === '_all' && planFilter === '_all' ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Building2 className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tenants yet.</p>
        </div>
      ) : (
        <DataTable<TenantInfo>
          data={tenants}
          columns={columns}
          onRowClick={handleRowClick}
          loading={isLoading}
          emptyMessage="No tenants match your filters"
          mobileCard={mobileCard}
        />
      )}

      {/* Pagination */}
      {(offset > 0 || hasMore) && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
