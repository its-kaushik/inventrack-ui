import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, Calendar, Clock } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { SearchInput, StatusBadge, EmptyState } from '@/components/shared';
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
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { useSupplierPayablesSummary } from '@/hooks/use-credit';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/cn';

function getAgingBadge(days: number): { status: 'green' | 'amber' | 'red' | 'blue'; label: string } {
  if (days <= 30) return { status: 'green', label: '0-30d' };
  if (days <= 60) return { status: 'amber', label: '30-60d' };
  if (days <= 90) return { status: 'amber', label: '60-90d' };
  return { status: 'red', label: '90d+' };
}

export default function SupplierPayablesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [agingBucket, setAgingBucket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('amount');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useSupplierPayablesSummary({
    agingBucket: agingBucket === 'all' ? undefined : agingBucket,
    sortBy,
  });

  const suppliers = useMemo(() => {
    if (!data?.suppliers) return [];
    if (!search) return data.suppliers;
    const q = search.toLowerCase();
    return data.suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone?.includes(q),
    );
  }, [data?.suppliers, search]);

  return (
    <div className="space-y-4 p-4 desktop:p-6">
      <PageHeader title="Supplier Payables" showBack onBack={() => navigate('/credit')} />

      {/* Summary */}
      {data?.summary && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-neutral-500">Total Payable</p>
              <p className="text-2xl font-bold text-error-600">
                {formatINR(data.summary.totalOutstanding)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">{data.summary.count} suppliers</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aging tabs */}
      <Tabs value={agingBucket} onValueChange={(val) => setAgingBucket(val ?? 'all')}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {data?.summary.aging.map((a) => (
            <TabsTrigger key={a.bucket} value={a.bucket}>
              {a.label} ({a.count})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." />
        </div>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? 'amount')}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="aging">Aging</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && suppliers.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No outstanding payables"
          description="All supplier payments are up to date."
        />
      )}

      {/* List */}
      {!isLoading && suppliers.length > 0 && (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {suppliers.map((supplier) => {
                const aging = getAgingBadge(supplier.agingDays);
                return (
                  <Card
                    key={supplier.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/credit/suppliers/${supplier.id}`)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-800 truncate">{supplier.name}</p>
                          {supplier.contactPerson && (
                            <p className="text-xs text-neutral-400">{supplier.contactPerson}</p>
                          )}
                          {supplier.phone && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                              <Phone className="size-3" /> {supplier.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-error-600">
                            {formatINR(supplier.outstandingBalance)}
                          </p>
                          <StatusBadge status={aging.status} label={aging.label} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                        {supplier.nextDueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" /> Due: {formatDate(supplier.nextDueDate)}
                          </span>
                        )}
                        <span className="capitalize">{supplier.paymentTerms.replace('_', ' ')}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => {
                    const aging = getAgingBadge(supplier.agingDays);
                    return (
                      <TableRow
                        key={supplier.id}
                        className="cursor-pointer hover:bg-neutral-50"
                        onClick={() => navigate(`/credit/suppliers/${supplier.id}`)}
                      >
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-neutral-500">{supplier.phone ?? '—'}</TableCell>
                        <TableCell className="capitalize">{supplier.paymentTerms.replace('_', ' ')}</TableCell>
                        <TableCell>{supplier.nextDueDate ? formatDate(supplier.nextDueDate) : '—'}</TableCell>
                        <TableCell><StatusBadge status={aging.status} label={aging.label} /></TableCell>
                        <TableCell className="text-right font-bold text-error-600">
                          {formatINR(supplier.outstandingBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
