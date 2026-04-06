import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  ScanLine,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  RefreshCw,
  IndianRupee,
  BarChart3,
} from 'lucide-react';

import { MetricCard, StatusBadge, SyncStatusIndicator, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { useDashboard } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth.store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/cn';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { data, isLoading, refetch, isRefetching } = useDashboard();

  const role = user?.role ?? 'salesman';
  const isManager = role === 'owner' || role === 'manager' || role === 'super_admin';

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">
            {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm text-neutral-500">
            Here's what's happening at your store
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          aria-label="Refresh dashboard"
          className={cn(isRefetching && 'animate-spin')}
        >
          <RefreshCw className="size-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-500">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isManager && (
              <Button onClick={() => navigate('/pos')} className="touch-target">
                <ShoppingCart className="size-4" data-icon="inline-start" />
                New Bill
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/products/stock-adjust')} className="touch-target">
              <Package className="size-4" data-icon="inline-start" />
              Add Stock
            </Button>
            <Button variant="outline" onClick={() => navigate('/products')} className="touch-target">
              <ScanLine className="size-4" data-icon="inline-start" />
              View Products
            </Button>
            {isManager && (
              <Button variant="outline" onClick={() => navigate('/labels')} className="touch-target">
                <BarChart3 className="size-4" data-icon="inline-start" />
                Print Labels
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Owner/Manager Dashboard */}
      {isManager && data && (
        <>
          {/* Sales metrics */}
          <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
            <MetricCard
              label="Today's Sales"
              value={formatINR(data.todaySales.total)}
              trendValue={`${data.todaySales.count} bills`}
            />
            <MetricCard
              label="Avg Transaction"
              value={formatINR(data.todaySales.avgTransaction)}
            />
            <MetricCard
              label="This Month"
              value={formatINR(data.mtd.currentMonth)}
              trend={data.mtd.changePercent > 0 ? 'up' : data.mtd.changePercent < 0 ? 'down' : 'flat'}
              trendValue={`${Math.abs(data.mtd.changePercent).toFixed(0)}% vs last month`}
            />
            <MetricCard
              label="Last Month"
              value={formatINR(data.mtd.lastMonth)}
            />
          </div>

          {/* Alerts row */}
          <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
            <AlertCard
              label="Low Stock"
              count={data.lowStockCount}
              status={data.lowStockCount > 0 ? 'amber' : 'green'}
              onClick={() => navigate('/products?stockStatus=low_stock')}
            />
            <AlertCard
              label="Aging Stock"
              count={data.agingStockCount}
              status={data.agingStockCount > 0 ? 'amber' : 'green'}
              onClick={() => navigate('/products?stockStatus=aging')}
            />
            <AlertCard
              label="Credit Due"
              count={data.overdueReceivableCount}
              status={data.overdueReceivableCount > 0 ? 'red' : 'green'}
              onClick={() => navigate('/credit')}
            />
            <AlertCard
              label="Supplier Due"
              count={data.overduePayableCount}
              status={data.overduePayableCount > 0 ? 'red' : 'green'}
              onClick={() => navigate('/credit/suppliers')}
            />
          </div>

          {/* Credit summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-neutral-500">Receivable (Khata)</p>
                <p className={cn('text-xl font-bold', parseAmount(data.totalReceivable) > 0 ? 'text-error-600' : 'text-neutral-800')}>
                  {formatINR(data.totalReceivable)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-neutral-500">Payable (Suppliers)</p>
                <p className={cn('text-xl font-bold', parseAmount(data.totalPayable) > 0 ? 'text-warning-600' : 'text-neutral-800')}>
                  {formatINR(data.totalPayable)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top selling */}
          {data.topSelling.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Top Selling Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topSelling.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">{item.productName}</p>
                        {item.variantDescription && (
                          <p className="truncate text-xs text-neutral-500">{item.variantDescription}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-neutral-800">{formatINR(item.revenue)}</p>
                        <p className="text-xs text-neutral-400">{item.quantitySold} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync status */}
          <Card>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-neutral-700">Sync Status</p>
                <SyncStatusIndicator
                  status={!isOnline ? 'offline' : data.pendingBillCount > 0 ? 'syncing' : 'synced'}
                  pendingCount={data.pendingBillCount}
                />
              </div>
              {data.unresolvedConflictCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/sync-review')}
                  className="text-error-600 border-error-200"
                >
                  {data.unresolvedConflictCount} conflicts
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Salesman Dashboard (simplified) */}
      {!isManager && data && (
        <>
          {/* Recent stock added by this salesman */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Recent Stock Added</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentStockAdded.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">No recent stock entries</p>
              ) : (
                <div className="space-y-2">
                  {data.recentStockAdded.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">{item.productName}</p>
                        {item.variantDescription && (
                          <p className="truncate text-xs text-neutral-500">{item.variantDescription}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-success-600">+{item.quantity}</p>
                        <p className="text-xs text-neutral-400">{formatDateTime(item.addedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory alerts (salesman can still see) */}
          <div className="grid grid-cols-2 gap-3">
            <AlertCard
              label="Low Stock"
              count={data.lowStockCount}
              status={data.lowStockCount > 0 ? 'amber' : 'green'}
              onClick={() => navigate('/products?stockStatus=low_stock')}
            />
            <AlertCard
              label="Aging Stock"
              count={data.agingStockCount}
              status={data.agingStockCount > 0 ? 'amber' : 'green'}
              onClick={() => navigate('/products?stockStatus=aging')}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──

function AlertCard({
  label,
  count,
  status,
  onClick,
}: {
  label: string;
  count: number;
  status: 'green' | 'amber' | 'red';
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{label}</p>
          <StatusBadge
            status={status}
            label={count === 0 ? 'OK' : String(count)}
          />
        </div>
        <p className={cn(
          'mt-1 text-2xl font-bold',
          status === 'green' ? 'text-success-600' : status === 'amber' ? 'text-warning-600' : 'text-error-600',
        )}>
          {count}
        </p>
      </CardContent>
    </Card>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-card" />
    </div>
  );
}
