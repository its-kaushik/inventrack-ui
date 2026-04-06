import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { StatusBadge, DateRangePicker, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useStockMovements } from '@/hooks/use-inventory';
import { formatDateTime, toISODate } from '@/lib/format-date';
import { cn } from '@/lib/cn';
import type { MovementType } from '@/types/enums';
import type { StockMovement } from '@/api/inventory.api';

// ── Movement type display config ──

const MOVEMENT_CONFIG: Record<
  MovementType,
  { label: string; color: 'blue' | 'green' | 'amber' | 'red' }
> = {
  purchase: { label: 'Purchase', color: 'blue' },
  sale: { label: 'Sale', color: 'green' },
  sale_return: { label: 'Sale Return', color: 'amber' },
  purchase_return: { label: 'Purchase Return', color: 'amber' },
  adjustment: { label: 'Adjustment', color: 'red' },
  opening_balance: { label: 'Opening', color: 'blue' },
};

// ── Loading skeleton ──

function MovementsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-input p-3"
        >
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

// ── Movement row (mobile card) ──

function MovementRow({ movement }: { movement: StockMovement }) {
  const navigate = useNavigate();
  const config = MOVEMENT_CONFIG[movement.movementType] ?? {
    label: movement.movementType,
    color: 'blue' as const,
  };

  // For adjustments, use red if negative qty
  const badgeColor =
    movement.movementType === 'adjustment' && movement.quantity < 0
      ? 'red'
      : config.color;

  const qtyPositive = movement.quantity > 0;

  const handleReferenceClick = () => {
    if (!movement.referenceId || !movement.reference) return;

    // Navigate to the bill or PO based on movement type
    if (
      movement.movementType === 'sale' ||
      movement.movementType === 'sale_return'
    ) {
      navigate(`/sales/${movement.referenceId}`);
    } else if (
      movement.movementType === 'purchase' ||
      movement.movementType === 'purchase_return'
    ) {
      navigate(`/purchase-orders/${movement.referenceId}`);
    }
  };

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(movement.createdAt)}
      </TableCell>
      <TableCell>
        <StatusBadge status={badgeColor} label={config.label} />
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'font-semibold tabular-nums',
            qtyPositive ? 'text-success-700' : 'text-error-700',
          )}
        >
          {qtyPositive ? '+' : ''}
          {movement.quantity}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums text-foreground">
        {movement.balanceAfter}
      </TableCell>
      <TableCell>
        {movement.reference ? (
          movement.referenceId ? (
            <button
              type="button"
              className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
              onClick={handleReferenceClick}
            >
              {movement.reference}
            </button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {movement.reference}
            </span>
          )
        ) : movement.notes ? (
          <span className="text-sm text-muted-foreground">{movement.notes}</span>
        ) : (
          <span className="text-sm text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {movement.createdByName}
      </TableCell>
    </TableRow>
  );
}

// ── Mobile movement card for small screens ──

function MovementCard({ movement }: { movement: StockMovement }) {
  const navigate = useNavigate();
  const config = MOVEMENT_CONFIG[movement.movementType] ?? {
    label: movement.movementType,
    color: 'blue' as const,
  };

  const badgeColor =
    movement.movementType === 'adjustment' && movement.quantity < 0
      ? 'red'
      : config.color;

  const qtyPositive = movement.quantity > 0;

  const handleReferenceClick = () => {
    if (!movement.referenceId || !movement.reference) return;
    if (
      movement.movementType === 'sale' ||
      movement.movementType === 'sale_return'
    ) {
      navigate(`/sales/${movement.referenceId}`);
    } else if (
      movement.movementType === 'purchase' ||
      movement.movementType === 'purchase_return'
    ) {
      navigate(`/purchase-orders/${movement.referenceId}`);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-input p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={badgeColor} label={config.label} />
          {movement.reference && movement.referenceId ? (
            <button
              type="button"
              className="truncate text-xs font-medium text-primary-600 underline-offset-2 hover:underline"
              onClick={handleReferenceClick}
            >
              {movement.reference}
            </button>
          ) : movement.reference ? (
            <span className="truncate text-xs text-muted-foreground">
              {movement.reference}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(movement.createdAt)} &middot; {movement.createdByName}
        </p>
        {movement.notes && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {movement.notes}
          </p>
        )}
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-base font-semibold tabular-nums',
            qtyPositive ? 'text-success-700' : 'text-error-700',
          )}
        >
          {qtyPositive ? '+' : ''}
          {movement.quantity}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          Bal: {movement.balanceAfter}
        </p>
      </div>
    </div>
  );
}

// ── Main page ──

export default function StockMovementPage() {
  const { variantId } = useParams<{
    productId: string;
    variantId: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Variant info from query params
  const productName = searchParams.get('productName') ?? 'Product';
  const sku = searchParams.get('sku') ?? '';
  const currentStock = searchParams.get('currentStock');
  const variantDescription = searchParams.get('variantDescription') ?? '';

  // Date range filter
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build query params
  const queryParams = useMemo(
    () => ({
      ...(startDate ? { startDate: toISODate(startDate) } : {}),
      ...(endDate ? { endDate: toISODate(endDate) } : {}),
      page,
      limit,
    }),
    [startDate, endDate, page],
  );

  const { data, isLoading } = useStockMovements(variantId ?? '', queryParams);

  const movements = data?.data ?? [];
  const meta = data?.meta;

  const handleDateRangeChange = useCallback(
    (start: Date | null, end: Date | null) => {
      setStartDate(start);
      setEndDate(end);
      setPage(1); // Reset to first page on filter change
    },
    [],
  );

  return (
    <div>
      <PageHeader title="Stock History" showBack />

      <div className="flex flex-col gap-4 px-4 pb-8 desktop:px-6">
        {/* Variant info bar */}
        <Card size="sm">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{productName}</p>
                {variantDescription && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {variantDescription}
                  </p>
                )}
                {sku && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    SKU: {sku}
                  </p>
                )}
              </div>
              {currentStock != null && (
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {currentStock}
                  </p>
                  <p className="text-xs text-muted-foreground">In Stock</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date range filter */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />

        {/* Loading state */}
        {isLoading && <MovementsSkeleton />}

        {/* Empty state */}
        {!isLoading && movements.length === 0 && (
          <EmptyState
            icon={Package}
            title="No movements found"
            description="There are no stock movements for this variant in the selected date range."
          />
        )}

        {/* Desktop table view */}
        {!isLoading && movements.length > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <MovementRow key={m.id} movement={m} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="flex flex-col gap-2 desktop:hidden">
              {movements.map((m) => (
                <MovementCard key={m.id} movement={m} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
