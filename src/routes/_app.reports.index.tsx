import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BarChart3,
  PieChart,
  Tag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  XCircle,
  Factory,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  Wallet,
  Receipt,
  Truck,
  ArrowUpDown,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export const Route = createFileRoute('/_app/reports/')({
  component: ReportsHubPage,
})

const reportTypes = [
  {
    type: 'daily_sales',
    title: 'Daily Sales Summary',
    description: 'Total sales, returns, net sales, payment split',
    icon: BarChart3,
  },
  {
    type: 'sales_by_category',
    title: 'Sales by Category',
    description: 'Which categories sell most',
    icon: PieChart,
  },
  {
    type: 'sales_by_brand',
    title: 'Sales by Brand',
    description: 'Brand-wise performance',
    icon: Tag,
  },
  {
    type: 'sales_by_salesperson',
    title: 'Sales by Salesperson',
    description: 'Per-person sales',
    icon: Users,
  },
  {
    type: 'inventory_valuation',
    title: 'Inventory Valuation',
    description: 'Total stock value at cost',
    icon: Package,
  },
  {
    type: 'aging_inventory',
    title: 'Aging Inventory',
    description: 'Items beyond threshold',
    icon: Clock,
  },
  {
    type: 'low_stock',
    title: 'Low Stock Report',
    description: 'Items below minimum',
    icon: AlertTriangle,
  },
  {
    type: 'dead_stock',
    title: 'Dead Stock Report',
    description: 'Zero-sale items',
    icon: XCircle,
  },
  {
    type: 'supplier_ledger',
    title: 'Supplier Ledger',
    description: 'Per-supplier transactions',
    icon: Factory,
  },
  {
    type: 'customer_ledger',
    title: 'Customer Ledger (Khata)',
    description: 'Per-customer transactions',
    icon: Users,
  },
  {
    type: 'outstanding_payables',
    title: 'Outstanding Payables',
    description: 'Owed to suppliers',
    icon: TrendingDown,
  },
  {
    type: 'outstanding_receivables',
    title: 'Outstanding Receivables',
    description: 'Owed by customers',
    icon: TrendingUp,
  },
  {
    type: 'profit_loss',
    title: 'Profit & Loss',
    description: 'Revenue, COGS, expenses, net',
    icon: DollarSign,
  },
  {
    type: 'bargain_discount',
    title: 'Bargain Discount Report',
    description: 'Additional discounts given',
    icon: Percent,
  },
  {
    type: 'cash_register',
    title: 'Cash Register Report',
    description: 'Daily reconciliation',
    icon: Wallet,
  },
  {
    type: 'gst_summary',
    title: 'GST Summary',
    description: 'Tax liability for filing',
    icon: Receipt,
  },
  {
    type: 'purchase_summary',
    title: 'Purchase Summary',
    description: 'Purchases by supplier/period',
    icon: Truck,
  },
  {
    type: 'stock_movement',
    title: 'Stock Movement',
    description: 'All stock in/out entries',
    icon: ArrowUpDown,
  },
] as const

function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and view reports across sales, inventory, finance, and more.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Link
            key={report.type}
            to="/reports/$type"
            params={{ type: report.type }}
            className="group"
          >
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <report.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {report.title}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
