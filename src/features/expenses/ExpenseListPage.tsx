import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import {
  Receipt,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  EmptyState,
  FAB,
  StatusBadge,
  ConfirmSheet,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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

import {
  useExpenses,
  useDeleteExpense,
  useExpenseCategories,
} from '@/hooks/use-expenses';
import { useIsMobile } from '@/hooks/use-media-query';
import { useAuthStore } from '@/stores/auth.store';
import { formatINR, parseAmount } from '@/lib/currency';
import { formatDate } from '@/lib/format-date';
import { toISODate } from '@/lib/format-date';

// ── Constants ──

const PAGE_LIMIT = 20;

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
};

// ── Skeleton loaders ──

function ExpenseCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

function ExpenseTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role === 'owner' || user?.role === 'manager';

  // ── Local state ──
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Derived dates ──
  const startDate = toISODate(startOfMonth(currentMonth));
  const endDate = toISODate(endOfMonth(currentMonth));
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  // ── Data fetching ──
  const { data: expensesResponse, isLoading } = useExpenses({
    startDate,
    endDate,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const { data: categories = [] } = useExpenseCategories();
  const deleteMutation = useDeleteExpense();

  const expenses = expensesResponse?.data ?? [];
  const meta = expensesResponse?.meta ?? {
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  };

  // ── Summary ──
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + parseAmount(e.amount), 0),
    [expenses],
  );

  // ── Handlers ──
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setPage(1);
  };

  const goToNextMonth = () => {
    if (!isCurrentMonth) {
      setCurrentMonth((prev) => addMonths(prev, 1));
      setPage(1);
    }
  };

  const handleCategoryChange = (val: string | null) => {
    setCategoryFilter(val ?? 'all');
    setPage(1);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const isEmpty = !isLoading && expenses.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader
        title="Expenses"
        action={{
          label: 'Add Expense',
          onClick: () => navigate('/expenses/new'),
          icon: Plus,
        }}
      />

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 px-4 pb-3 desktop:px-6">
        <Button variant="outline" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[120px] text-center text-sm font-semibold text-neutral-900">
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Summary + category filter */}
      <div className="flex flex-col gap-3 px-4 pb-3 desktop:flex-row desktop:items-center desktop:justify-between desktop:px-6">
        <Card className="border-0 bg-primary-50">
          <CardContent className="p-3">
            <p className="text-sm text-primary-700">
              Total expenses this month:{' '}
              <span className="font-bold">{formatINR(totalAmount)}</span>
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">Category:</span>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-6 desktop:px-6">
        {isLoading ? (
          isMobile ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ExpenseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <ExpenseTableSkeleton />
            </div>
          )
        ) : isEmpty ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description="No expenses recorded for this month."
            actionLabel="Add Expense"
            onAction={() => navigate('/expenses/new')}
          />
        ) : (
          <>
            {/* Mobile: Card list */}
            <div className="flex flex-col gap-3 desktop:hidden">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {expense.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(expense.expenseDate)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status="blue" label={expense.categoryName} />
                        <span className="text-xs text-muted-foreground">
                          {PAYMENT_MODE_LABELS[expense.paymentMode] ?? expense.paymentMode}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {expense.createdByName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatINR(expense.amount)}
                      </span>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-error-600 hover:bg-error-50 hover:text-error-700"
                          onClick={() => setDeleteTarget(expense.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden rounded-xl bg-card ring-1 ring-foreground/10 desktop:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Created By</TableHead>
                    {canDelete && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(expense.expenseDate)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status="blue" label={expense.categoryName} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatINR(expense.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {PAYMENT_MODE_LABELS[expense.paymentMode] ?? expense.paymentMode}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {expense.createdByName}
                      </TableCell>
                      {canDelete && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-error-600 hover:bg-error-50 hover:text-error-700"
                            onClick={() => setDeleteTarget(expense.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
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
        <FAB label="Add Expense" onClick={() => navigate('/expenses/new')} />
      )}

      {/* Delete confirmation */}
      <ConfirmSheet
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
