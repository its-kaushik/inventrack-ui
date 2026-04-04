import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfDay,
  startOfQuarter,
  startOfDay,
} from 'date-fns'
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
import { Loader2, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getProfitLoss } from '@/api/pnl.api'
import { KpiCard } from '@/components/data/kpi-card'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { DateRangePicker } from '@/components/form/date-range-picker'
import type { DateRange } from '@/components/form/date-range-picker'
import { formatCompact, formatIndianCurrency } from '@/lib/format-currency'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_app/accounting/pnl')({
  component: ProfitLossPage,
})

type PeriodPreset = 'month' | 'quarter' | 'fy' | 'custom'

function getFyStart(): Date {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return new Date(year, 3, 1) // Apr 1
}

function getPresetRange(preset: PeriodPreset): DateRange {
  const now = new Date()
  switch (preset) {
    case 'month':
      return { from: startOfMonth(now), to: endOfDay(now) }
    case 'quarter':
      return { from: startOfQuarter(now), to: endOfDay(now) }
    case 'fy':
      return { from: startOfDay(getFyStart()), to: endOfDay(now) }
    case 'custom':
      return { from: startOfMonth(now), to: endOfDay(now) }
  }
}

interface CategoryRow {
  categoryName: string
  revenue: number
  cogs: number
  profit: number
}

function ProfitLossPage() {
  const [preset, setPreset] = useState<PeriodPreset>('month')
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange('month'))

  const handlePresetChange = (val: string) => {
    const p = val as PeriodPreset
    setPreset(p)
    if (p !== 'custom') {
      setDateRange(getPresetRange(p))
    }
  }

  const params = useMemo(
    () => ({
      date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(endOfDay(new Date()), 'yyyy-MM-dd'),
    }),
    [dateRange],
  )

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pnl.data(params as Record<string, unknown>),
    queryFn: () => getProfitLoss(params).then((res) => res.data),
  })

  const grossMarginPct =
    data && data.revenue > 0
      ? ((data.grossProfit / data.revenue) * 100).toFixed(1)
      : '0'

  const chartData = useMemo(() => {
    if (!data) return []
    return [
      {
        name: 'Summary',
        Revenue: data.revenue,
        COGS: data.cogs,
        Expenses: data.totalExpenses,
      },
    ]
  }, [data])

  const categoryColumns: Column<CategoryRow>[] = useMemo(
    () => [
      {
        key: 'categoryName',
        header: 'Category',
        render: (row) => <span className="text-sm font-medium">{row.categoryName}</span>,
      },
      {
        key: 'revenue',
        header: 'Revenue',
        className: 'text-right',
        render: (row) => <Amount value={row.revenue} />,
      },
      {
        key: 'cogs',
        header: 'COGS',
        className: 'text-right',
        render: (row) => <Amount value={row.cogs} />,
      },
      {
        key: 'profit',
        header: 'Profit',
        className: 'text-right',
        render: (row) => (
          <span
            className={cn(
              'font-mono tabular-nums',
              row.profit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive',
            )}
          >
            {formatIndianCurrency(row.profit)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Profit &amp; Loss</h1>
        {preset === 'custom' && (
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        )}
      </div>

      {/* Period Selector */}
      <Tabs value={preset} onValueChange={handlePresetChange}>
        <TabsList>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="fy">This FY</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
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
              label="Revenue"
              value={formatCompact(data.revenue)}
            />
            <KpiCard
              icon={Minus}
              label="Total Expenses"
              value={formatCompact(data.totalExpenses)}
            />
            <KpiCard
              icon={data.netProfit >= 0 ? TrendingUp : TrendingDown}
              label="Net Profit"
              value={formatCompact(data.netProfit)}
            />
          </div>

          {/* P&L Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Profit &amp; Loss Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Revenue */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Revenue
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatIndianCurrency(data.revenue)}
                </span>
              </div>

              {/* COGS */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Less: Cost of Goods Sold
                </span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  ({formatIndianCurrency(data.cogs)})
                </span>
              </div>

              <Separator />

              {/* Gross Profit */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Gross Profit{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({grossMarginPct}% margin)
                  </span>
                </span>
                <span
                  className={cn(
                    'font-mono text-sm font-semibold tabular-nums',
                    data.grossProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {formatIndianCurrency(data.grossProfit)}
                </span>
              </div>

              <Separator />

              {/* Expenses breakdown */}
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Expenses
              </p>
              {data.expenses.length > 0 ? (
                <div className="space-y-1.5 pl-2">
                  {data.expenses.map((exp) => (
                    <div
                      key={exp.category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-muted-foreground">
                        {exp.category}
                      </span>
                      <span className="font-mono text-sm tabular-nums">
                        {formatIndianCurrency(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pl-2 text-sm text-muted-foreground">No expenses recorded.</p>
              )}

              {/* Total Expenses */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </span>
                <span className="font-mono text-sm tabular-nums">
                  ({formatIndianCurrency(data.totalExpenses)})
                </span>
              </div>

              <Separator />

              {/* Net Profit */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">Net Profit</span>
                <span
                  className={cn(
                    'font-mono text-base font-bold tabular-nums',
                    data.netProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {formatIndianCurrency(data.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs COGS vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val: number) => formatCompact(val)}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatIndianCurrency(Number(value ?? 0)),
                        String(name),
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="Revenue"
                      stackId="a"
                      fill="rgb(34, 197, 94)"
                    />
                    <Bar
                      dataKey="COGS"
                      stackId="b"
                      fill="rgb(59, 130, 246)"
                    />
                    <Bar
                      dataKey="Expenses"
                      stackId="c"
                      fill="rgb(239, 68, 68)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Drilldown */}
          {data.byCategory && data.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable<CategoryRow>
                  data={data.byCategory}
                  columns={categoryColumns}
                />
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No data available for the selected period.
        </p>
      )}
    </div>
  )
}
