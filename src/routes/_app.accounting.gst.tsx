import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  DollarSign,
  ArrowRight,
  CreditCard,
  TrendingDown,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getGstDashboard } from '@/api/gst.api'
import type { GstParams } from '@/api/gst.api'
import { useTenant } from '@/hooks/use-tenant'
import { KpiCard } from '@/components/data/kpi-card'
import { StatusBadge } from '@/components/data/status-badge'
import { formatCompact } from '@/lib/format-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/accounting/gst')({
  component: GstDashboardPage,
})

function generatePeriodOptions(): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = []
  const months = [
    'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
  ]
  // Generate for current and previous FY
  const now = new Date()
  const currentYear = now.getFullYear()
  const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1

  for (let fy = fyStartYear; fy >= fyStartYear - 1; fy--) {
    for (let i = 0; i < 12; i++) {
      const year = i < 9 ? fy : fy + 1
      const monthIndex = (i + 3) % 12
      const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      options.push({
        label: `${months[i]} ${year}`,
        value,
      })
    }
  }

  return options
}

function GstDashboardPage() {
  const { gstScheme } = useTenant()
  const periodOptions = useMemo(() => generatePeriodOptions(), [])
  const [period, setPeriod] = useState(periodOptions[0]?.value ?? '')

  const params: GstParams = useMemo(() => ({ period }), [period])

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.gst.dashboard(params as Record<string, unknown>),
    queryFn: () => getGstDashboard(params).then((res) => res.data),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">GST Dashboard</h1>
          <StatusBadge variant={gstScheme === 'regular' ? 'info' : 'warning'}>
            {gstScheme === 'regular' ? 'Regular' : 'Composition'}
          </StatusBadge>
        </div>
        <Select value={period} onValueChange={(val) => setPeriod(val ?? period)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          {gstScheme === 'regular' ? (
            <RegularSchemeView data={data} />
          ) : (
            <CompositionSchemeView data={data} />
          )}
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No GST data available for the selected period.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Regular scheme view
// ---------------------------------------------------------------------------

function RegularSchemeView({
  data,
}: {
  data: {
    outputTax?: number
    inputTaxCredit?: number
    netLiability?: number
  }
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={DollarSign}
          label="Output Tax"
          value={formatCompact(data.outputTax ?? 0)}
        />
        <KpiCard
          icon={CreditCard}
          label="Input Tax Credit"
          value={formatCompact(data.inputTaxCredit ?? 0)}
        />
        <KpiCard
          icon={TrendingDown}
          label="Net Liability"
          value={formatCompact(data.netLiability ?? 0)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <LinkCard
          title="GSTR-1 Data"
          description="View outward supplies data for filing GSTR-1."
          to="/accounting/gst/gstr1"
        />
        <LinkCard
          title="GSTR-3B Summary"
          description="View GSTR-3B summary of tax liability."
          to="/accounting/gst/gstr3b"
        />
        <LinkCard
          title="ITC Register"
          description="View detailed input tax credit entries."
          to="/accounting/gst/itc"
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Composition scheme view
// ---------------------------------------------------------------------------

function CompositionSchemeView({
  data,
}: {
  data: {
    totalTurnover?: number
    compositionTax?: number
  }
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={DollarSign}
          label="Total Turnover"
          value={formatCompact(data.totalTurnover ?? 0)}
        />
        <KpiCard
          icon={CreditCard}
          label="Tax (1% of Turnover)"
          value={formatCompact(data.compositionTax ?? 0)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LinkCard
          title="CMP-08 Data"
          description="View quarterly CMP-08 return data."
          to="/accounting/gst/cmp08"
        />
        <LinkCard
          title="GSTR-4 Annual Return"
          description="View GSTR-4 annual return data."
          to="/accounting/gst/gstr4"
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Shared Link Card
// ---------------------------------------------------------------------------

function LinkCard({
  title,
  description,
  to,
}: {
  title: string
  description: string
  to: string
}) {
  return (
    <Card className="transition-colors hover:bg-accent/50">
      <Link to={to} className="block">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button variant="link" className="mt-2 h-auto p-0 text-sm" tabIndex={-1}>
            View Details <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
