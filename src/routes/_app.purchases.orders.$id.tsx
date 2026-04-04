import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Send,
  PackageCheck,
  Truck,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { queryKeys } from '@/api/query-keys'
import {
  getPurchaseOrder,
  updatePurchaseOrder,
} from '@/api/purchase-orders.api'
import type { POStatus } from '@/types/enums'
import { formatIndianCurrency } from '@/lib/format-currency'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { Skeleton } from '@/components/data/loading-skeleton'
import { EmptyState } from '@/components/data/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'

export const Route = createFileRoute('/_app/purchases/orders/$id')({
  component: PurchaseOrderDetailPage,
})

function statusVariant(
  status: POStatus,
): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'sent':
      return 'info'
    case 'partial':
      return 'warning'
    case 'received':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

function PurchaseOrderDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: po,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.purchaseOrders.detail(id),
    queryFn: () => getPurchaseOrder(id).then((res) => res.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      updatePurchaseOrder(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.all(),
      })
      toast.success('Purchase order status updated.')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status.',
      )
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !po) {
    return (
      <div className="space-y-4">
        <Link to="/purchases/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Back to Orders
          </Button>
        </Link>
        <EmptyState
          icon={ClipboardList}
          title="Purchase order not found"
          description="The purchase order you are looking for does not exist."
          action={{
            label: 'Go to Orders',
            onClick: () => navigate({ to: '/purchases/orders' }),
          }}
        />
      </div>
    )
  }

  const totalAmount = parseFloat(po.totalAmount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/purchases/orders">
            <Button variant="ghost" size="icon-sm" className="mt-1">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono lg:text-2xl">
                {po.poNumber}
              </h1>
              <StatusBadge variant={statusVariant(po.status)}>
                {po.status}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              {po.supplier?.name ?? 'Unknown Supplier'} |{' '}
              {format(new Date(po.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2">
          {po.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate('sent')}
              disabled={updateStatusMutation.isPending}
            >
              <Send className="mr-1 size-3.5" />
              Send to Supplier
            </Button>
          )}
          {po.status === 'sent' && (
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate('received')}
              disabled={updateStatusMutation.isPending}
            >
              <PackageCheck className="mr-1 size-3.5" />
              Mark Received
            </Button>
          )}
          {(po.status === 'sent' || po.status === 'partial') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: '/purchases/receive' })}
            >
              <Truck className="mr-1 size-3.5" />
              Receive Goods
            </Button>
          )}
        </div>
      </div>

      {/* PO Summary Card */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">PO Number</p>
              <p className="font-mono font-medium">{po.poNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Supplier</p>
              <p className="font-medium">
                {po.supplier?.name ?? 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(po.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-mono font-bold tabular-nums">
                {formatIndianCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Line Items ({po.items?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {po.items && po.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Ordered</TableHead>
                  {(po.status === 'partial' || po.status === 'received') && (
                    <TableHead className="text-right">Qty Received</TableHead>
                  )}
                  <TableHead className="text-right">Expected Cost</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => {
                  const cost = parseFloat(item.expectedCostPrice)
                  const lineAmt = cost * item.quantity
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.product?.name ?? item.productId}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs text-muted-foreground">
                              {item.product.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      {(po.status === 'partial' || po.status === 'received') && (
                        <TableCell className="text-right tabular-nums">
                          {item.receivedQuantity ?? 0}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Amount value={cost} className="text-sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Amount
                          value={lineAmt}
                          className="text-sm font-medium"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No line items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Total Amount</span>
            <Amount
              value={totalAmount}
              className="text-xl font-bold font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {po.notes && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <div>
        <Link to="/purchases/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-1 size-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    </div>
  )
}
