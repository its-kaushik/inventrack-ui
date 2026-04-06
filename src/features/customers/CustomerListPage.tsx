import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Phone,
  ShoppingCart,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, EmptyState, FAB, StatusBadge } from '@/components/shared';
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

import { useCustomers } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';

// ── Constants ──

const PAGE_LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'recent_visit', label: 'Recent Visit' },
  { value: 'total_spend', label: 'Total Spend' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

// ── Skeleton loaders ──

function CustomerCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Visits</TableHead>
          <TableHead className="text-right">Total Spend</TableHead>
          <TableHead>Last Visit</TableHead>
          <TableHead className="text-right">Khata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-10" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function CustomerListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('name');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // ── Data fetching ──
  const { data: customersResponse, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    sortBy,
    page,
    limit: PAGE_LIMIT,
  });

  const customers = customersResponse?.data ?? [];
  const meta = customersResponse?.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

  // Reset to page 1 when search or sort changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortValue);
    setPage(1);
  };

  // ── Empty state check ──
  const isEmpty = !isLoading && customers.length === 0;
  const isSearching = !!debouncedSearch;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader
        title="Customers"
        action={{
          label: 'Add Customer',
          onClick: () => navigate('/customers/new'),
          icon: Plus,
        }}
      />

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 px-4 pt-3 pb-2 desktop:flex-row desktop:items-center desktop:px-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or phone..."
          className="w-full desktop:flex-1"
        />
        <Select value={sortBy} onValueChange={(val) => handleSortChange(val ?? 'name')}>
          <SelectTrigger className="w-full desktop:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CustomerCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <CustomerTableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          isSearching ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Try adjusting your search query."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add your first customer to get started."
              actionLabel="Add Customer"
              onAction={() => navigate('/customers/new')}
            />
          )
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {customers.map((customer) => {
                const outstanding = parseFloat(customer.outstandingBalance || '0');
                return (
                  <div
                    key={customer.id}
                    className="cursor-pointer rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/customers/${customer.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {customer.name}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3 shrink-0" aria-hidden="true" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                      {outstanding > 0 && (
                        <StatusBadge
                          status={outstanding >= 5000 ? 'red' : 'amber'}
                          label={`${formatINR(outstanding)} due`}
                        />
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="size-3" aria-hidden="true" />
                          {customer.visitCount} visits
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" aria-hidden="true" />
                          {formatDate(customer.lastVisitAt)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatINR(customer.totalSpend)}
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
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Khata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const outstanding = parseFloat(customer.outstandingBalance || '0');
                    return (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {customer.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {customer.visitCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-foreground">
                          {formatINR(customer.totalSpend)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(customer.lastVisitAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {outstanding > 0 ? (
                            <StatusBadge
                              status={outstanding >= 5000 ? 'red' : 'amber'}
                              label={`${formatINR(outstanding)} due`}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{'\u2014'}</span>
                          )}
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
          label="Add Customer"
          onClick={() => navigate('/customers/new')}
        />
      )}
    </div>
  );
}
