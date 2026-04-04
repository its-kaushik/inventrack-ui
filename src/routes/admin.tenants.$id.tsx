import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  ArrowLeft,
  Package,
  Receipt,
  DollarSign,
  Users,
  HardDrive,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { queryKeys } from '@/api/query-keys'
import {
  getTenantDetail,
  getTenantUsage,
  suspendTenant,
  activateTenant,
  extendTrial,
  changePlan,
} from '@/api/admin.api'
import { KpiCard } from '@/components/data/kpi-card'
import { StatusBadge } from '@/components/data/status-badge'
import { formatDate, formatRelative } from '@/lib/format-date'
import { formatCompact } from '@/lib/format-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { TenantStatus, SubscriptionPlan } from '@/types/enums'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/tenants/$id')({
  component: TenantDetailPage,
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

function TenantDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showExtendTrialDialog, setShowExtendTrialDialog] = useState(false)
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false)
  const [trialDays, setTrialDays] = useState(7)
  const [selectedPlan, setSelectedPlan] = useState<string>('basic')

  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: queryKeys.admin.tenants.detail(id),
    queryFn: () => getTenantDetail(id).then((res) => res.data),
  })

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: queryKeys.admin.tenants.usage(id),
    queryFn: () => getTenantUsage(id).then((res) => res.data),
    enabled: !!tenant,
  })

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants.detail(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants.usage(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants.all() })
  }

  const suspendMutation = useMutation({
    mutationFn: () => suspendTenant(id),
    onSuccess: () => { toast.success('Tenant suspended'); invalidateAll() },
    onError: () => toast.error('Failed to suspend tenant'),
  })

  const activateMutation = useMutation({
    mutationFn: () => activateTenant(id),
    onSuccess: () => { toast.success('Tenant activated'); invalidateAll() },
    onError: () => toast.error('Failed to activate tenant'),
  })

  const extendTrialMutation = useMutation({
    mutationFn: (days: number) => extendTrial(id, days),
    onSuccess: () => {
      toast.success('Trial extended')
      setShowExtendTrialDialog(false)
      invalidateAll()
    },
    onError: () => toast.error('Failed to extend trial'),
  })

  const changePlanMutation = useMutation({
    mutationFn: (plan: string) => changePlan(id, plan),
    onSuccess: () => {
      toast.success('Plan changed')
      setShowChangePlanDialog(false)
      invalidateAll()
    },
    onError: () => toast.error('Failed to change plan'),
  })

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tenantError || !tenant) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-sm text-destructive">Failed to load tenant details.</p>
        <Link to="/admin/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Back to Tenants
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <Link to="/admin/tenants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="size-4" />
          Back to Tenants
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <StatusBadge variant={STATUS_VARIANT[tenant.status]}>
            {tenant.status}
          </StatusBadge>
          <StatusBadge variant={PLAN_VARIANT[tenant.plan]}>
            {tenant.plan}
          </StatusBadge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Created: {formatDate(tenant.createdAt)}
          {tenant.trialEndsAt && (
            <> &middot; Trial ends: {formatDate(tenant.trialEndsAt)}</>
          )}
        </p>
      </div>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{tenant.ownerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-mono text-sm">{tenant.ownerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm">{tenant.ownerEmail ?? 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usageLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : usage ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard icon={Package} label="Products" value={usage.totalProducts} />
            <KpiCard icon={Receipt} label="Bills" value={usage.totalBills} />
            <KpiCard icon={DollarSign} label="Revenue" value={formatCompact(usage.totalRevenue)} />
            <KpiCard icon={Users} label="Users" value={usage.totalUsers} />
            <KpiCard icon={HardDrive} label="Storage" value={`${usage.storageUsedMb} MB`} />
            <KpiCard
              icon={Clock}
              label="Last Bill"
              value={usage.lastBillAt ? formatRelative(usage.lastBillAt) : 'No bills'}
            />
          </div>

          {/* Monthly Trend Chart */}
          {usage.monthlyBillTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usage.monthlyBillTrend}>
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
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        fill="rgb(59, 130, 246)"
                        radius={[4, 4, 0, 0]}
                        name="Bills"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        fill="rgb(34, 197, 94)"
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {/* Tenant Config */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">GST Scheme</p>
              <p className="text-sm font-medium capitalize">{tenant.gstScheme}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">GSTIN</p>
              <p className="text-sm font-mono">{tenant.gstin ?? 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Invoice Prefix</p>
              <p className="text-sm font-mono">{tenant.invoicePrefix}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm">{tenant.address ?? 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Support Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(tenant.status === 'active' || tenant.status === 'trial') && (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendDialog(true)}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Suspend Tenant
            </Button>
          )}

          {tenant.status === 'suspended' && (
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Activate Tenant
            </Button>
          )}

          {tenant.status === 'trial' && (
            <Button
              variant="outline"
              onClick={() => setShowExtendTrialDialog(true)}
            >
              Extend Trial
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setSelectedPlan(tenant.plan)
              setShowChangePlanDialog(true)
            }}
          >
            Change Plan
          </Button>
        </CardContent>
      </Card>

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title="Suspend Tenant"
        description={`Are you sure you want to suspend "${tenant.name}"? They will lose access to all features.`}
        confirmLabel="Suspend"
        onConfirm={() => suspendMutation.mutate()}
        destructive
      />

      {/* Extend Trial Dialog */}
      <Dialog open={showExtendTrialDialog} onOpenChange={setShowExtendTrialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="trial-days">Number of days to extend</Label>
            <Input
              id="trial-days"
              type="number"
              min={1}
              max={365}
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendTrialDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => extendTrialMutation.mutate(trialDays)}
              disabled={extendTrialMutation.isPending || trialDays < 1}
            >
              {extendTrialMutation.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Select plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {(['free', 'basic', 'pro'] as const).map((plan) => (
                <div key={plan} className="flex items-center gap-3">
                  <RadioGroupItem value={plan} />
                  <Label className="cursor-pointer capitalize">{plan}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => changePlanMutation.mutate(selectedPlan)}
              disabled={changePlanMutation.isPending || selectedPlan === tenant.plan}
            >
              {changePlanMutation.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
