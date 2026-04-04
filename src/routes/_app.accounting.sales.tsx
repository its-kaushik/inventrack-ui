import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, endOfDay, startOfMonth } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, Receipt, TrendingUp } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getSalesOverview } from '@/api/sales.api'
import type { SalesOverviewParams } from '@/api/sales.api'
import { KpiCard } from '@/components/data/kpi-card'
import { DateRangePicker } from '@/components/form/date-range-picker'
import type { DateRange } from '@/components/form/date-range-picker'
import { formatCompact, formatIndianCurrency } from '@/lib/format-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_app/accounting/sales')({
  component: SalesOverviewPage,
})

type Period = 'daily' | 'weekly' | 'monthly'

function SalesOverviewPage() {
  const [period, setPeriod] = useState<Period>('daily')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })

  const params: SalesOverviewParams = useMemo(
    () => ({
      period,
      date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    }),
    [period, dateRange],
  )

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sales.overview(params as Record<string, unknown>),
    queryFn: () => getSalesOverview(params).then((res) => res.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Sales Overview</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Period Tabs */}
      <Tabs
        value={period}
        onValueChange={(val) => setPeriod(val as Period)}
      >
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={DollarSign}
              label="Total Sales"
              value={formatCompact(data.totalSales)}
            />
            <KpiCard
              icon={Receipt}
              label="Total Bills"
              value={data.totalBills.toLocaleString('en-IN')}
            />
            <KpiCard
              icon={TrendingUp}
              label="Avg Bill Value"
              value={formatCompact(data.avgBillValue)}
            />
          </div>

          {/* Sales Trend Chart */}
          {data.trend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val: string) => {
                          try {
                            return format(new Date(val), 'dd MMM')
                          } catch {
                            return val
                          }
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val: number) => formatCompact(val)}
                      />
                      <Tooltip
                        formatter={(value) => [formatIndianCurrency(Number(value ?? 0)), 'Sales']}
                        labelFormatter={(label) => {
                          try {
                            return format(new Date(String(label)), 'dd MMM yyyy')
                          } catch {
                            return String(label)
                          }
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breakdown Sections */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.byCategory.map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.categoryName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} bill{item.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-mono text-sm tabular-nums">
                          {formatIndianCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Brand */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Brand</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byBrand.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.byBrand.map((item) => (
                      <div
                        key={item.brandId}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.brandName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} bill{item.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-mono text-sm tabular-nums">
                          {formatIndianCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Salesperson */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Salesperson</CardTitle>
              </CardHeader>
              <CardContent>
                {data.bySalesperson.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.bySalesperson.map((item) => (
                      <div
                        key={item.userId}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} bill{item.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="font-mono text-sm tabular-nums">
                          {formatIndianCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No sales data available for the selected period.
        </p>
      )}
    </div>
  )
}
