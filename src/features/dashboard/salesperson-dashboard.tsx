import { Link } from '@tanstack/react-router'
import { DollarSign, ShoppingCart } from 'lucide-react'
import type { SalespersonDashboardData } from '@/types/models'
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

interface SalespersonDashboardProps {
  data: SalespersonDashboardData
}

export function SalespersonDashboard({ data }: SalespersonDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={DollarSign}
          label={`My Sales Today (${data.mySalesToday.count} bills)`}
          value={formatCompact(data.mySalesToday.total)}
        />
        <Card className="flex items-center justify-center gap-0 py-3">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Quick Start</p>
              <Link to="/pos">
                <Button size="sm" className="mt-1">
                  Start Billing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent My Bills */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentMyBills.length > 0 ? (
            <div className="space-y-2">
              {data.recentMyBills.map((bill) => (
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
              No bills created yet today.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
