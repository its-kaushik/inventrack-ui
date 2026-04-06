import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  SearchInput,
  EmptyState,
  StatusBadge,
  DateRangePicker,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

import { useSales } from '@/hooks/use-sales';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR } from '@/lib/currency';
import { formatDateTime, formatDate } from '@/lib/format-date';
import { toISODate } from '@/lib/format-date';
import type { SaleStatus } from '@/types/enums';

// ── Constants ──

const PAGE_LIMIT = 20;

// ── Helpers ──

function getSaleStatusBadge(status: SaleStatus) {
  switch (status) {
    case 'completed':
      return { color: 'green' as const, label: 'Completed' };
    case 'cancelled':
      return { color: 'red' as const, label: 'Cancelled' };
    case 'returned':
      return { color: 'amber' as const, label: 'Returned' };
    case 'partially_returned':
      return { color: 'amber' as const, label: 'Partial Return' };
    default:
      return { color: 'blue' as const, label: status };
  }
}

// ── Skeleton loaders ──

function BillCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function BillTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function BillLookupPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // ── Data fetching ──
  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      startDate: startDate ? toISODate(startDate) : undefined,
      endDate: endDate ? toISODate(endDate) : undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    [debouncedSearch, startDate, endDate, page],
  );

  const { data: salesResponse, isLoading } = useSales(params);
  const sales = salesResponse?.data ?? [];
  const meta = salesResponse?.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handleBillTap = (id: string) => {
    navigate(`/pos/receipt/${id}`);
  };

  const isEmpty = !isLoading && sales.length === 0;
  const isSearching = !!debouncedSearch || !!startDate || !!endDate;

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Bill Lookup" showBack />

      {/* Search */}
      <div className="px-4 pb-2 desktop:px-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by bill #, customer name or phone..."
        />
      </div>

      {/* Date filter toggle + picker */}
      <div className="px-4 pb-3 desktop:px-6">
        <Button
          variant={startDate || endDate ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setDateFilterOpen(!dateFilterOpen)}
        >
          {startDate || endDate ? 'Date filter active' : 'Filter by date'}
        </Button>

        {dateFilterOpen && (
          <div className="mt-3">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <BillCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <BillTableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          <EmptyState
            icon={ClipboardList}
            title={isSearching ? 'No bills found' : 'No bills yet'}
            description={
              isSearching
                ? 'Try adjusting your search or date filters.'
                : 'Bills will appear here once sales are created.'
            }
          />
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {sales.map((sale) => {
                const statusInfo = getSaleStatusBadge(sale.status);
                return (
                  <button
                    key={sale.id}
                    type="button"
                    className="rounded-xl bg-card p-4 text-left shadow-sm ring-1 ring-foreground/10 transition-colors active:bg-neutral-50"
                    onClick={() => handleBillTap(sale.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {sale.billNumber}
                      </span>
                      <StatusBadge status={statusInfo.color} label={statusInfo.label} />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {formatDateTime(sale.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        Customer ID: {sale.customerId.slice(0, 8)}...
                      </span>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatINR(sale.netPayable)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const statusInfo = getSaleStatusBadge(sale.status);
                    return (
                      <TableRow
                        key={sale.id}
                        className="cursor-pointer"
                        onClick={() => handleBillTap(sale.id)}
                      >
                        <TableCell className="font-medium text-foreground">
                          {sale.billNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(sale.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sale.customerId.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatINR(sale.netPayable)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusInfo.color} label={statusInfo.label} />
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
    </div>
  );
}
