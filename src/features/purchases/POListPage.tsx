import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  SearchInput,
  StatusBadge,
  EmptyState,
  FAB,
  DateRangePicker,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR } from '@/lib/currency';
import { formatDate, toISODate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

import type { POStatus } from '@/types/enums';

// ── Constants ──

const PAGE_LIMIT = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'fully_received', label: 'Fully Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE_MAP: Record<POStatus, { color: 'blue' | 'amber' | 'green' | 'red'; label: string }> = {
  draft: { color: 'blue', label: 'Draft' },
  sent: { color: 'amber', label: 'Sent' },
  partially_received: { color: 'amber', label: 'Partially Received' },
  fully_received: { color: 'green', label: 'Fully Received' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

// ── Skeleton loaders ──

function POCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function POTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PO Number</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-center">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function POListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // ── Supplier list for filter dropdown ──
  const { data: suppliersResponse } = useSuppliers({ limit: 200, isActive: 'true' });
  const suppliers = suppliersResponse?.data ?? [];

  // ── Data fetching ──
  const { data: poResponse, isLoading } = usePurchaseOrders({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    supplierId: supplierFilter !== 'all' ? supplierFilter : undefined,
    startDate: startDate ? toISODate(startDate) : undefined,
    endDate: endDate ? toISODate(endDate) : undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const purchaseOrders = poResponse?.data ?? [];
  const meta = poResponse?.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value ?? 'all');
    setPage(1);
  };

  const handleSupplierChange = (value: string | null) => {
    setSupplierFilter(value ?? 'all');
    setPage(1);
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  // ── Empty state check ──
  const isEmpty = !isLoading && purchaseOrders.length === 0;
  const isSearching = !!debouncedSearch || statusFilter !== 'all' || supplierFilter !== 'all' || !!startDate || !!endDate;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader
        title="Purchase Orders"
        action={{
          label: 'Create PO',
          onClick: () => navigate('/purchases/new'),
          icon: Plus,
        }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 px-4 pb-2 desktop:px-6">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search PO number..."
          className="w-full"
        />

        {/* Status + Supplier filters */}
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end">
          <div className="flex flex-1 gap-3">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full desktop:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={handleSupplierChange}>
              <SelectTrigger className="w-full desktop:w-48">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-6 pt-3 desktop:px-6">
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <POCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <POTableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          isSearching ? (
            <EmptyState
              icon={Truck}
              title="No purchase orders found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <EmptyState
              icon={Truck}
              title="No purchase orders yet"
              description="Create your first purchase order to get started."
              actionLabel="Create PO"
              onAction={() => navigate('/purchases/new')}
            />
          )
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {purchaseOrders.map((po) => {
                const badge = STATUS_BADGE_MAP[po.status];
                return (
                  <div
                    key={po.id}
                    className="cursor-pointer rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
                    onClick={() => navigate(`/purchases/${po.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/purchases/${po.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {po.poNumber}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {po.supplierName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(po.orderDate)}
                        </p>
                      </div>
                      <StatusBadge status={badge.color} label={badge.label} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        {po.itemCount} {po.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatINR(po.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => {
                    const badge = STATUS_BADGE_MAP[po.status];
                    return (
                      <TableRow
                        key={po.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/purchases/${po.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {po.poNumber}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {po.supplierName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(po.orderDate)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {po.itemCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="font-medium text-foreground">
                            {formatINR(po.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={badge.color} label={badge.label} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                >
                  <ChevronLeft className="size-4" data-icon="inline-start" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                >
                  Next
                  <ChevronRight className="size-4" data-icon="inline-end" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <FAB
          label="Create PO"
          onClick={() => navigate('/purchases/new')}
        />
      )}
    </div>
  );
}
