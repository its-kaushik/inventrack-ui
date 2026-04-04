import { Link } from '@tanstack/react-router'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Package,
  Truck,
  Users,
  IndianRupee,
  Wallet,
  Clock,
} from 'lucide-react'
import type { DashboardData } from '@/types/models'
import { KpiCard } from '@/components/data/kpi-card'
import { Amount } from '@/components/data/amount'
import { formatCompact } from '@/lib/format-currency'
import { formatRelative } from '@/lib/format-date'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GettingStartedChecklist } from '@/features/dashboard/getting-started-checklist'

const COLORS: Record<string, string> = {
  cash: 'rgb(34, 197, 94)',
  upi: 'rgb(139, 92, 246)',
  card: 'rgb(59, 130, 246)',
}

const MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
}

interface OwnerDashboardProps {
  data: DashboardData
}

function computeChange(today: number, yesterday: number): number | undefined {
  if (yesterday === 0 && today === 0) return undefined
  if (yesterday === 0) return 100
  return ((today - yesterday) / yesterday) * 100
}

export function OwnerDashboard({ data }: OwnerDashboardProps) {
  const salesChange = computeChange(
    data.todaySales.total,
    data.todaySales.yesterdayTotal,
  )

  const pieData = Object.entries(data.paymentModeSplit)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: MODE_LABELS[key] ?? key,
      value,
      color: COLORS[key] ?? '#94a3b8',
    }))

  const hasPieData = pieData.length > 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label={`Today's Sales (${data.todaySales.count} bills)`}
          value={formatCompact(data.todaySales.total)}
          change={salesChange}
        />
        {data.todayProfit !== undefined && (
          <KpiCard
            icon={IndianRupee}
            label="Today's Profit"
            value={formatCompact(data.todayProfit)}
          />
        )}
        {data.cashInHand !== undefined && (
          <KpiCard
            icon={Wallet}
            label="Cash in Hand"
            value={formatCompact(data.cashInHand)}
          />
        )}
        <KpiCard
          icon={Users}
          label="Outstanding Receivables"
          value={formatCompact(data.outstandingReceivables)}
        />
        <KpiCard
          icon={Truck}
          label="Outstanding Payables"
          value={formatCompact(data.outstandingPayables)}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Low Stock Alert"
          value={data.lowStockCount}
          className={
            data.lowStockCount > 0
              ? 'ring-amber-500/30 dark:ring-amber-400/30'
              : undefined
          }
        />
        {data.agingInventoryCount !== undefined &&
          data.agingInventoryCount > 0 && (
            <KpiCard
              icon={Clock}
              label="Aging Inventory"
              value={data.agingInventoryCount}
              className="ring-orange-500/30 dark:ring-orange-400/30"
            />
          )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Mode Split */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Mode Split</CardTitle>
          </CardHeader>
          <CardContent>
            {hasPieData ? (
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCompact(Number(value ?? 0))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {pieData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name}
                      </span>
                      <Amount
                        value={entry.value}
                        compact
                        className="ml-auto text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales data yet today.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/pos">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart className="size-4" />
                New Bill
              </Button>
            </Link>
            <Link to="/inventory/products/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Package className="size-4" />
                Add Product
              </Button>
            </Link>
            <Link to="/purchases/receive">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Truck className="size-4" />
                Record Purchase
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentBills.length > 0 ? (
            <div className="space-y-2">
              {data.recentBills.map((bill) => (
                <Link
                  key={bill.id}
                  to="/pos/bills/$id"
                  params={{ id: bill.id }}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{bill.billNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.customer?.name ?? 'Walk-in'} &middot;{' '}
                      {formatRelative(bill.createdAt)}
                    </p>
                  </div>
                  <Amount value={Number(bill.netAmount)} className="text-sm" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No bills created yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Sellers & Supplier Payments Due */}
      {(data.topSellers || data.supplierPaymentsDue) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.topSellers && data.topSellers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex-1">Product</span>
                    <span className="w-16 text-right">Qty</span>
                    <span className="w-24 text-right">Revenue</span>
                  </div>
                  {data.topSellers.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm"
                    >
                      <span className="flex-1 truncate">
                        {item.productName}
                      </span>
                      <span className="w-16 text-right tabular-nums text-muted-foreground">
                        {item.quantitySold}
                      </span>
                      <Amount
                        value={item.revenue}
                        compact
                        className="w-24 text-right text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.supplierPaymentsDue && data.supplierPaymentsDue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supplier Payments Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex-1">Supplier</span>
                    <span className="w-24 text-right">Amount</span>
                  </div>
                  {data.supplierPaymentsDue.map((item) => (
                    <div
                      key={item.supplierId}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm"
                    >
                      <span className="flex-1 truncate">
                        {item.supplierName}
                      </span>
                      <Amount
                        value={item.amount}
                        compact
                        className="w-24 text-right text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Getting Started Checklist */}
      <GettingStartedChecklist />
    </div>
  )
}
