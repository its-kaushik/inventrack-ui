import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Users,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, StatusBadge, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

import { useCustomerKhataSummary } from '@/hooks/use-credit';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

// ── Constants ──

const SORT_OPTIONS = [
  { value: 'amount_desc', label: 'Amount (High-Low)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'aging_desc', label: 'Aging (Oldest First)' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

// ── Helpers ──

function getAgingBadge(agingDays: number): { status: 'green' | 'amber' | 'red'; label: string } {
  if (agingDays <= 30) return { status: 'green', label: `${agingDays}d` };
  if (agingDays <= 60) return { status: 'amber', label: `${agingDays}d` };
  // 60-90 and 90+ both use red (StatusBadge only supports green/amber/red/blue)
  return { status: 'red', label: `${agingDays}d` };
}

// ── Skeleton loaders ──

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

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
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Outstanding</TableHead>
          <TableHead>Last Payment</TableHead>
          <TableHead>Aging</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function CustomerKhataListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [agingBucket, setAgingBucket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortValue>('amount_desc');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCustomerKhataSummary({
    agingBucket: agingBucket === 'all' ? undefined : agingBucket,
    sortBy,
  });

  const summary = data?.summary;
  const customers = data?.customers ?? [];

  // Client-side search filter
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [customers, search]);

  const isEmpty = !isLoading && filteredCustomers.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Customer Khata" />

      <div className="flex flex-col gap-4 px-4 pb-6 desktop:px-6">
        {/* Summary bar */}
        {isLoading ? (
          <SummaryCardSkeleton />
        ) : summary ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Wallet className="size-5 text-error-600" aria-hidden="true" />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-bold text-error-600">
                  Total Receivable: {formatINR(summary.totalOutstanding)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {summary.count} customer{summary.count !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Aging filter tabs */}
        <Tabs
          value={agingBucket}
          onValueChange={(val) => setAgingBucket(val ?? 'all')}
        >
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="all" className="flex-1">
              All
              {summary && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({summary.count})
                </span>
              )}
            </TabsTrigger>
            {(summary?.aging ?? []).map((bucket) => (
              <TabsTrigger key={bucket.bucket} value={bucket.bucket} className="flex-1">
                <span className="hidden sm:inline">{bucket.label}</span>
                <span className="sm:hidden">
                  {bucket.bucket === '0-30' && '0-30d'}
                  {bucket.bucket === '30-60' && '30-60d'}
                  {bucket.bucket === '60-90' && '60-90d'}
                  {bucket.bucket === '90+' && '90d+'}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({bucket.count})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search + Sort */}
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or phone..."
            className="w-full desktop:flex-1"
          />
          <Select value={sortBy} onValueChange={(val) => setSortBy((val ?? 'amount_desc') as SortValue)}>
            <SelectTrigger className="w-full desktop:w-52">
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
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CustomerCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <TableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          search.trim() ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Try adjusting your search query."
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title="No outstanding credit"
              description="All customer accounts are clear."
            />
          )
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {filteredCustomers.map((customer) => {
                const outstanding = parseAmount(customer.outstandingBalance);
                const aging = getAgingBadge(customer.agingDays);
                return (
                  <div
                    key={customer.id}
                    className="cursor-pointer rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors active:bg-muted/50"
                    onClick={() => navigate(`/credit/customers/${customer.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/credit/customers/${customer.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {customer.name}
                        </p>
                        <a
                          href={`tel:${customer.phone}`}
                          className="mt-1 flex items-center gap-1 text-xs text-primary-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="size-3 shrink-0" aria-hidden="true" />
                          {customer.phone}
                        </a>
                      </div>
                      <span className="text-lg font-bold tabular-nums text-error-600">
                        {formatINR(outstanding)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" aria-hidden="true" />
                          {customer.lastPaymentDate
                            ? formatDate(customer.lastPaymentDate)
                            : 'No payment'}
                        </span>
                      </div>
                      <StatusBadge status={aging.status} label={aging.label} />
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
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Aging</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const outstanding = parseAmount(customer.outstandingBalance);
                    const aging = getAgingBadge(customer.agingDays);
                    return (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/credit/customers/${customer.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {customer.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-primary-600 underline-offset-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.phone}
                          </a>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold tabular-nums text-error-600">
                            {formatINR(outstanding)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.lastPaymentDate
                            ? formatDate(customer.lastPaymentDate)
                            : '\u2014'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={aging.status} label={aging.label} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
