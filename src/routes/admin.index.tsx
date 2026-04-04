import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Building2, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { queryKeys } from '@/api/query-keys'
import { getAdminDashboard } from '@/api/admin.api'
import { KpiCard } from '@/components/data/kpi-card'
import { StatusBadge } from '@/components/data/status-badge'
import { formatRelative } from '@/lib/format-date'
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
          label="Total Tenants"
          value={data.totalTenants}
        />
        <KpiCard
          icon={Building2}
          label="Active Tenants"
          value={data.activeTenants}
        />
        <KpiCard
          icon={Users}
          label="Total Users"
          value={data.totalUsers}
        />
        <KpiCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCompact(data.totalRevenue)}
        />
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.growthData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => formatCompact(v)}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Revenue' ? formatCompact(Number(value ?? 0)) : value
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="tenants"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    dot={false}
                    name="Tenants"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No growth data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Signups */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSignups.length > 0 ? (
              <div className="space-y-2">
                {data.recentSignups.map((tenant) => (
                  <Link
                    key={tenant.id}
                    to="/admin/tenants/$id"
                    params={{ id: tenant.id }}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.ownerName} &middot; {formatRelative(tenant.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={PLAN_VARIANT[tenant.plan]}>
                        {tenant.plan}
                      </StatusBadge>
                      <StatusBadge variant={STATUS_VARIANT[tenant.status]}>
                        {tenant.status}
                      </StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No signups yet.
              </p>
            )}
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
                <p className="text-xs text-muted-foreground">Active Trials</p>
                <p className="text-xl font-semibold">{data.trialTenants}</p>
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
                <p className="text-xl font-semibold">
                  {data.totalTenants - data.activeTenants - data.trialTenants}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
