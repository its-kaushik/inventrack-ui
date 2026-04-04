import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Building2, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getAdminDashboard } from '@/api/admin.api'
import { KpiCard } from '@/components/data/kpi-card'
import { StatusBadge } from '@/components/data/status-badge'
import { formatCompact } from '@/lib/format-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TenantStatus, SubscriptionPlan } from '@/types/enums'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
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

function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => getAdminDashboard().then((res) => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Failed to load admin dashboard data.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Building2}
          label="Active Tenants"
          value={data.tenantsByStatus?.active ?? 0}
        />
        <KpiCard icon={Building2} label="Signups This Month" value={data.signupsThisMonth} />
        <KpiCard icon={Users} label="Total Users" value={data.totalUsers} />
        <KpiCard
          icon={DollarSign}
          label="Bills This Month"
          value={formatCompact(data.billsThisMonth)}
        />
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {data.tenantsByPlan ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(data.tenantsByPlan).map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <StatusBadge variant={PLAN_VARIANT[plan as SubscriptionPlan] ?? 'default'}>
                    {plan}
                  </StatusBadge>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No plan data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenants by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.tenantsByStatus ?? {}).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <StatusBadge variant={STATUS_VARIANT[status as TenantStatus] ?? 'default'}>
                    {status}
                  </StatusBadge>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Signups This Month</p>
                <p className="text-xl font-semibold">{data.signupsThisMonth}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-xl font-semibold">{data.tenantsByStatus?.suspended ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
