import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, EmptyState, FAB, StatusBadge } from '@/components/shared';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useSuppliers } from '@/hooks/use-suppliers';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-media-query';
import { useAuthStore } from '@/stores/auth.store';
import { formatINR } from '@/lib/currency';
import { cn } from '@/lib/cn';

// ── Constants ──

const PAGE_LIMIT = 20;

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  cod: 'COD',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_60: 'Net 60',
  advance: 'Advance',
};

// ── Skeleton loaders ──

function SupplierCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function SupplierTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Payment Terms</TableHead>
          <TableHead className="text-right">Outstanding</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function SupplierListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('active');

  const debouncedSearch = useDebounce(search, 300);

  // Derive isActive from tab
  const isActive = activeTab === 'active' ? 'true' : 'false';

  // ── Data fetching ──
  const { data: suppliersResponse, isLoading } = useSuppliers({
    search: debouncedSearch || undefined,
    isActive,
    page,
    limit: PAGE_LIMIT,
  });

  const suppliers = suppliersResponse?.data ?? [];
  const meta = suppliersResponse?.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

  // Reset to page 1 when search or tab changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  // ── Empty state check ──
  const isEmpty = !isLoading && suppliers.length === 0;
  const isSearching = !!debouncedSearch;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader
        title="Suppliers"
        action={
          canManage
            ? {
                label: 'Add Supplier',
                onClick: () => navigate('/suppliers/new'),
                icon: Plus,
              }
            : undefined
        }
      />

      {/* Tabs for Active / Inactive */}
      <div className="px-4 desktop:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 desktop:px-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search suppliers..."
          className="w-full"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SupplierCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <SupplierTableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          isSearching ? (
            <EmptyState
              icon={Building2}
              title="No suppliers found"
              description="Try adjusting your search query."
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No suppliers yet"
              description="Add your first supplier to get started."
              actionLabel={canManage ? 'Add Supplier' : undefined}
              onAction={canManage ? () => navigate('/suppliers/new') : undefined}
            />
          )
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {suppliers.map((supplier) => {
                const outstanding = parseFloat(supplier.outstandingBalance || '0');
                return (
                  <div
                    key={supplier.id}
                    className="cursor-pointer rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/suppliers/${supplier.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {supplier.name}
                        </p>
                        {supplier.contactPerson && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {supplier.contactPerson}
                          </p>
                        )}
                        {supplier.phone && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3 shrink-0" aria-hidden="true" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                      <StatusBadge
                        status={supplier.isActive ? 'green' : 'red'}
                        label={supplier.isActive ? 'Active' : 'Inactive'}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        {PAYMENT_TERMS_LABELS[supplier.paymentTerms] ?? supplier.paymentTerms}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          outstanding > 0 ? 'text-error-600' : 'text-foreground',
                        )}
                      >
                        {formatINR(outstanding)}
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
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => {
                    const outstanding = parseFloat(supplier.outstandingBalance || '0');
                    return (
                      <TableRow
                        key={supplier.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/suppliers/${supplier.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {supplier.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {supplier.contactPerson || '\u2014'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {supplier.phone || '\u2014'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {PAYMENT_TERMS_LABELS[supplier.paymentTerms] ?? supplier.paymentTerms}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span
                            className={cn(
                              'font-medium',
                              outstanding > 0 ? 'text-error-600' : 'text-foreground',
                            )}
                          >
                            {formatINR(outstanding)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={supplier.isActive ? 'green' : 'red'}
                            label={supplier.isActive ? 'Active' : 'Inactive'}
                          />
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
      {canManage && isMobile && (
        <FAB
          label="Add Supplier"
          onClick={() => navigate('/suppliers/new')}
        />
      )}
    </div>
  );
}
