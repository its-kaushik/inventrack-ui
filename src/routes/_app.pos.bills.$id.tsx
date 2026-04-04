import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer, Receipt } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getBill } from '@/api/bills.api'
import type { Bill } from '@/types/models'
import type { PaymentMode } from '@/types/enums'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { Skeleton } from '@/components/data/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format-date'

export const Route = createFileRoute('/_app/pos/bills/$id')({
  component: BillDetailPage,
})

function paymentModeLabel(mode: PaymentMode): string {
  const labels: Record<PaymentMode, string> = {
    cash: 'Cash',
    upi: 'UPI',
    card: 'Card',
    credit: 'Credit',
  }
  return labels[mode] ?? mode
}

function getStatusVariant(
  status: string,
): 'success' | 'error' | 'default' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'voided':
      return 'error'
    default:
      return 'default'
  }
}

function BillDetailPage() {
  const { id } = Route.useParams()

  const { data: bill, isLoading } = useQuery({
    queryKey: queryKeys.bills.detail(id),
    queryFn: () => getBill(id).then((res) => res.data),
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Receipt className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">Bill not found</p>
        <Link to="/pos/bills">
          <Button variant="outline">Back to Bills</Button>
        </Link>
      </div>
    )
  }

  const subtotal = parseFloat(bill.subtotal)
  const catalogDiscountTotal = parseFloat(bill.catalogDiscountTotal)
  const additionalDiscountAmount = parseFloat(bill.additionalDiscountAmount)
  const taxAmount = parseFloat(bill.taxAmount)
  const netAmount = parseFloat(bill.netAmount)

  return (
    <>
      {/* Screen layout */}
      <div className="flex-1 space-y-4 p-4 lg:p-6 print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/pos/bills">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-mono lg:text-2xl">
                  {bill.billNumber}
                </h1>
                <StatusBadge variant={getStatusVariant(bill.status)}>
                  {bill.status}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(bill.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 size-3.5" />
            Reprint
          </Button>
        </div>

        {/* Customer info */}
        {bill.customer && (
          <Card size="sm">
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{bill.customer.name}</span>
                {bill.customer.phone && (
                  <span className="text-muted-foreground">
                    ({bill.customer.phone})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Discount
                  </TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku}
                          {item.size && ` | ${item.size}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount value={parseFloat(item.unitPrice)} className="text-sm" />
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {item.catalogDiscountPct > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          -{item.catalogDiscountPct}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount
                        value={parseFloat(item.lineTotal)}
                        className="text-sm font-medium"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tax Summary */}
        {taxAmount > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {bill.items?.map((item) =>
                  parseFloat(item.gstAmount) > 0 ? (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">
                        GST @ {item.gstRate}% on {item.productName}
                      </span>
                      <Amount
                        value={parseFloat(item.gstAmount)}
                        className="text-sm"
                      />
                    </div>
                  ) : null,
                )}
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Tax</span>
                  <Amount value={taxAmount} className="text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Breakdown */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {bill.payments?.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {paymentModeLabel(p.mode)}
                    </Badge>
                    {p.reference && (
                      <span className="text-xs text-muted-foreground">
                        Ref: {p.reference}
                      </span>
                    )}
                  </div>
                  <Amount
                    value={parseFloat(p.amount)}
                    className="text-sm font-medium"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <Amount value={subtotal} className="text-sm" />
              </div>
              {catalogDiscountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Catalog Discount
                  </span>
                  <Amount
                    value={-catalogDiscountTotal}
                    className="text-sm text-emerald-600"
                  />
                </div>
              )}
              {additionalDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Additional Discount
                  </span>
                  <Amount
                    value={-additionalDiscountAmount}
                    className="text-sm text-emerald-600"
                  />
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <Amount value={taxAmount} className="text-sm" />
                </div>
              )}
              <Separator />
              <div className="flex justify-between pt-1">
                <span className="text-base font-semibold">Net Amount</span>
                <Amount
                  value={netAmount}
                  className="text-xl font-bold font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print-ready receipt layout */}
      <PrintReceipt bill={bill} />
    </>
  )
}

// --- Print Receipt ---

function PrintReceipt({ bill }: { bill: Bill }) {
  const subtotal = parseFloat(bill.subtotal)
  const catalogDiscountTotal = parseFloat(bill.catalogDiscountTotal)
  const additionalDiscountAmount = parseFloat(bill.additionalDiscountAmount)
  const taxAmount = parseFloat(bill.taxAmount)
  const netAmount = parseFloat(bill.netAmount)

  return (
    <div className="hidden print:block print:p-4 print:text-[11px] print:leading-tight">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
        }
      `}</style>

      <div className="mx-auto max-w-[72mm] font-mono">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-bold">INVOICE</p>
          <p className="text-[10px]">{bill.billNumber}</p>
          <p className="text-[10px]">{formatDateTime(bill.createdAt)}</p>
        </div>

        <div className="my-1 border-b border-dashed border-black" />

        {/* Customer */}
        {bill.customer && (
          <>
            <p className="text-[10px]">
              Customer: {bill.customer.name}
              {bill.customer.phone ? ` (${bill.customer.phone})` : ''}
            </p>
            <div className="my-1 border-b border-dashed border-black" />
          </>
        )}

        {/* Items */}
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-0.5">Item</th>
              <th className="text-right py-0.5">Qty</th>
              <th className="text-right py-0.5">Rate</th>
              <th className="text-right py-0.5">Amt</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item) => (
              <tr key={item.id}>
                <td className="py-0.5">
                  {item.productName}
                  {item.size ? ` (${item.size})` : ''}
                </td>
                <td className="text-right py-0.5">{item.quantity}</td>
                <td className="text-right py-0.5">
                  {parseFloat(item.unitPrice).toFixed(0)}
                </td>
                <td className="text-right py-0.5">
                  {parseFloat(item.lineTotal).toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-1 border-b border-dashed border-black" />

        {/* Totals */}
        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          {catalogDiscountTotal > 0 && (
            <div className="flex justify-between">
              <span>Cat. Discount</span>
              <span>-{catalogDiscountTotal.toFixed(2)}</span>
            </div>
          )}
          {additionalDiscountAmount > 0 && (
            <div className="flex justify-between">
              <span>Addl. Discount</span>
              <span>-{additionalDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="my-1 border-b border-black" />

        <div className="flex justify-between text-xs font-bold">
          <span>NET TOTAL</span>
          <span>{'\u20B9'}{netAmount.toFixed(2)}</span>
        </div>

        <div className="my-1 border-b border-dashed border-black" />

        {/* Payment */}
        <div className="space-y-0.5 text-[10px]">
          {bill.payments?.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>{paymentModeLabel(p.mode)}</span>
              <span>{parseFloat(p.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="my-2 border-b border-dashed border-black" />

        <p className="text-center text-[9px]">Thank you for shopping!</p>
      </div>
    </div>
  )
}
