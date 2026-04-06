import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck,
  Send,
  XCircle,
  Package,
  Printer,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  StatusBadge,
  ConfirmSheet,
  PrintActionSheet,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

import {
  usePurchaseOrder,
  useSendPurchaseOrder,
  useCancelPurchaseOrder,
} from '@/hooks/use-purchase-orders';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

import type { POStatus } from '@/types/enums';

// ── Constants ──

const STATUS_BADGE_MAP: Record<POStatus, { color: 'blue' | 'amber' | 'green' | 'red'; label: string }> = {
  draft: { color: 'blue', label: 'Draft' },
  sent: { color: 'amber', label: 'Sent' },
  partially_received: { color: 'amber', label: 'Partially Received' },
  fully_received: { color: 'green', label: 'Fully Received' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

// Steps for progress (excluding cancelled)
const LIFECYCLE_STEPS: { key: POStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partially_received', label: 'Partially Received' },
  { key: 'fully_received', label: 'Fully Received' },
];

function getStepIndex(status: POStatus): number {
  return LIFECYCLE_STEPS.findIndex((s) => s.key === status);
}

// ── Status progress bar ──

function StatusProgress({ status }: { status: POStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center rounded-lg bg-error-50 px-4 py-3">
        <XCircle className="mr-2 size-5 text-error-600" aria-hidden="true" />
        <span className="font-semibold text-error-700">Cancelled</span>
      </div>
    );
  }

  const activeIndex = getStepIndex(status);

  return (
    <div className="flex items-center gap-0" role="list" aria-label="Purchase order status">
      {LIFECYCLE_STEPS.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const isFuture = index > activeIndex;

        return (
          <div key={step.key} className="flex flex-1 items-center" role="listitem">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isCompleted && 'bg-success-500 text-white',
                  isActive && 'bg-primary-600 text-white',
                  isFuture && 'bg-neutral-200 text-neutral-500',
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="size-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-center text-[10px] font-medium leading-tight desktop:text-xs',
                  isCompleted && 'text-success-700',
                  isActive && 'text-primary-700',
                  isFuture && 'text-neutral-400',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last) */}
            {index < LIFECYCLE_STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1',
                  index < activeIndex ? 'bg-success-500' : 'bg-neutral-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6" aria-busy="true">
      {/* Progress skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Info card skeleton */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-32" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Items table skeleton */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Skeleton className="h-8 w-24 m-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 mb-3 h-10 w-full" />
        ))}
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: po, isLoading } = usePurchaseOrder(id!);
  const sendMutation = useSendPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();

  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);

  // ── Handlers ──
  const handleSend = () => {
    if (!po) return;
    sendMutation.mutate(po.id, {
      onSuccess: () => {
        // data re-fetched automatically via query invalidation
      },
    });
  };

  const handleCancel = () => {
    if (!po) return;
    cancelMutation.mutate(po.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." showBack />
        <DetailSkeleton />
      </div>
    );
  }

  if (!po) {
    return (
      <div>
        <PageHeader title="Purchase Order" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <Truck className="size-12 text-neutral-300" />
          <h3 className="mt-4 font-semibold text-neutral-900">
            Purchase order not found
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            This purchase order may have been deleted or you don&apos;t have access.
          </p>
          <Button className="mt-6" onClick={() => navigate('/purchases')}>
            Back to Purchase Orders
          </Button>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE_MAP[po.status];
  const isDraft = po.status === 'draft';
  const isSent = po.status === 'sent';
  const isPartiallyReceived = po.status === 'partially_received';
  const isFullyReceived = po.status === 'fully_received';
  const isCancelled = po.status === 'cancelled';
  const isReadOnly = isFullyReceived || isCancelled;

  return (
    <div>
      <PageHeader title={po.poNumber} showBack />

      <div className="flex flex-col gap-6 px-4 pb-8 desktop:px-6">
        {/* Status progress bar */}
        <StatusProgress status={po.status} />

        {/* PO info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <StatusBadge status={badge.color} label={badge.label} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted-foreground">PO Number</dt>
              <dd className="font-mono font-medium text-foreground">{po.poNumber}</dd>

              <dt className="text-muted-foreground">Supplier</dt>
              <dd className="font-medium text-foreground">
                {po.supplier.name}
                {po.supplier.phone && (
                  <span className="ml-2 text-muted-foreground">
                    ({po.supplier.phone})
                  </span>
                )}
              </dd>

              {po.supplier.contactPerson && (
                <>
                  <dt className="text-muted-foreground">Contact Person</dt>
                  <dd className="font-medium text-foreground">{po.supplier.contactPerson}</dd>
                </>
              )}

              <dt className="text-muted-foreground">Order Date</dt>
              <dd className="font-medium text-foreground">{formatDate(po.orderDate)}</dd>

              <dt className="text-muted-foreground">Expected Delivery</dt>
              <dd className="font-medium text-foreground">
                {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '\u2014'}
              </dd>

              <dt className="text-muted-foreground">Created By</dt>
              <dd className="font-medium text-foreground">{po.createdByName}</dd>

              {po.notes && (
                <>
                  <Separator className="col-span-2 my-1" />
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium text-foreground whitespace-pre-wrap">{po.notes}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Line Items ({po.items.length})</span>
              <span className="text-sm font-normal text-muted-foreground">
                {po.receivedQuantity}/{po.totalQuantity} received
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isMobile ? (
              /* Mobile: card layout */
              <div className="flex flex-col divide-y divide-border">
                {po.items.map((item) => {
                  const isItemFullyReceived = item.receivedQuantity >= item.quantity;
                  const isItemPartiallyReceived = item.receivedQuantity > 0 && item.receivedQuantity < item.quantity;

                  return (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {item.productName}
                          </p>
                          {item.variantDescription && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.variantDescription}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        </div>
                        {isItemFullyReceived ? (
                          <CheckCircle className="size-5 shrink-0 text-success-500" aria-label="Fully received" />
                        ) : isItemPartiallyReceived ? (
                          <StatusBadge
                            status="amber"
                            label={`${item.receivedQuantity}/${item.quantity}`}
                          />
                        ) : null}
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Ordered</span>
                          <p className="font-medium tabular-nums text-foreground">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Received</span>
                          <p className="font-medium tabular-nums text-foreground">{item.receivedQuantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending</span>
                          <p className="font-medium tabular-nums text-foreground">{item.pendingQuantity}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Cost: {formatINR(item.costPrice)}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          Total: {formatINR(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop: table layout */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-center">Ordered</TableHead>
                    <TableHead className="text-center">Received</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map((item) => {
                    const isItemFullyReceived = item.receivedQuantity >= item.quantity;
                    const isItemPartiallyReceived = item.receivedQuantity > 0 && item.receivedQuantity < item.quantity;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.variantDescription || '\u2014'}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {item.receivedQuantity}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {item.pendingQuantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(item.costPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatINR(item.lineTotal)}
                        </TableCell>
                        <TableCell>
                          {isItemFullyReceived ? (
                            <CheckCircle className="size-4 text-success-500" aria-label="Fully received" />
                          ) : isItemPartiallyReceived ? (
                            <StatusBadge
                              status="amber"
                              label={`${item.receivedQuantity}/${item.quantity}`}
                            />
                          ) : (
                            <Clock className="size-4 text-neutral-400" aria-label="Not received" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order total */}
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Order Total</span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatINR(po.totalAmount)}
          </span>
        </div>

        {/* Action buttons */}
        <section className="flex flex-col gap-3 desktop:flex-row desktop:justify-end">
          {/* Draft actions */}
          {isDraft && (
            <>
              <Button
                variant="outline"
                className="w-full gap-2 desktop:w-auto"
                onClick={() => navigate(`/purchases/${po.id}/edit`)}
              >
                Edit PO
              </Button>
              <Button
                className="w-full gap-2 desktop:w-auto"
                onClick={handleSend}
                disabled={sendMutation.isPending}
              >
                <Send className="size-4" />
                {sendMutation.isPending ? 'Sending...' : 'Send to Supplier'}
              </Button>
              <Button
                variant="destructive"
                className="w-full gap-2 desktop:w-auto"
                onClick={() => setCancelSheetOpen(true)}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="size-4" />
                Cancel PO
              </Button>
            </>
          )}

          {/* Sent actions */}
          {isSent && (
            <>
              <Button
                className="w-full gap-2 desktop:w-auto"
                onClick={() => navigate(`/purchases/receive?poId=${po.id}`)}
              >
                <Package className="size-4" />
                Receive Goods
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="destructive"
                className="w-full gap-2 desktop:w-auto"
                onClick={() => setCancelSheetOpen(true)}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="size-4" />
                Cancel PO
              </Button>
            </>
          )}

          {/* Partially received actions */}
          {isPartiallyReceived && (
            <>
              <Button
                className="w-full gap-2 desktop:w-auto"
                onClick={() => navigate(`/purchases/receive?poId=${po.id}`)}
              >
                <Package className="size-4" />
                Receive More
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="destructive"
                className="w-full gap-2 desktop:w-auto"
                onClick={() => setCancelSheetOpen(true)}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="size-4" />
                Cancel PO
              </Button>
            </>
          )}

          {/* Read-only actions (fully received / cancelled) */}
          {isReadOnly && (
            <Button
              variant="outline"
              className="w-full gap-2 desktop:w-auto"
              onClick={() => setPrintSheetOpen(true)}
            >
              <Printer className="size-4" />
              Print / Download
            </Button>
          )}
        </section>
      </div>

      {/* Cancel confirm sheet */}
      <ConfirmSheet
        open={cancelSheetOpen}
        onOpenChange={setCancelSheetOpen}
        title="Cancel Purchase Order"
        description={`Are you sure you want to cancel ${po.poNumber}? This action cannot be undone.`}
        confirmLabel="Cancel PO"
        cancelLabel="Keep PO"
        onConfirm={handleCancel}
        variant="destructive"
      />

      {/* Print action sheet */}
      <PrintActionSheet
        open={printSheetOpen}
        onOpenChange={setPrintSheetOpen}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}
