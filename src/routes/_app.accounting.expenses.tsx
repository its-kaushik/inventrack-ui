import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth, endOfDay } from 'date-fns'
import { toast } from 'sonner'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listExpenses, deleteExpense, listExpenseCategories } from '@/api/expenses.api'
import type { ExpenseFilters } from '@/api/expenses.api'
import type { Expense } from '@/types/models'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { StatusBadge } from '@/components/data/status-badge'
import { EmptyState } from '@/components/data/empty-state'
import { DateRangePicker } from '@/components/form/date-range-picker'
import type { DateRange } from '@/components/form/date-range-picker'
import { ConfirmDialog } from '@/components/feedback/confirm-dialog'
import { formatDate } from '@/lib/format-date'
import { formatIndianCurrency } from '@/lib/format-currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/accounting/expenses')({
  component: ExpenseListPage,
})

const PAGE_SIZE = 25

function ExpenseListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  const [offset, setOffset] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.expenses.categories(),
    queryFn: () => listExpenseCategories().then((res) => res.data),
  })

  const filters: ExpenseFilters = useMemo(
    () => ({
      category: categoryFilter || undefined,
      date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [categoryFilter, dateRange, offset],
  )

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.expenses.list(filters as Record<string, unknown>),
    queryFn: () => listExpenses(filters).then((res) => res.data),
  })

  const items = data?.items ?? []
  const hasMore = data?.hasMore ?? false

  // Monthly totals
  const monthlyTotal = useMemo(
    () => items.reduce((sum, e) => sum + Number(e.amount), 0),
    [items],
  )

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() })
      toast.success('Expense deleted.')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense.')
    },
  })

  const handleRowClick = useCallback(
    (expense: Expense) => {
      navigate({ to: '/accounting/expenses/new', search: { edit: expense.id } })
    },
    [navigate],
  )

  const columns: Column<Expense>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        render: (e) => <span className="text-sm">{formatDate(e.date)}</span>,
      },
      {
        key: 'category',
        header: 'Category',
        render: (e) => <StatusBadge variant="default">{e.category}</StatusBadge>,
      },
      {
        key: 'description',
        header: 'Description',
        hideOnMobile: true,
        render: (e) => (
          <span className="text-sm text-muted-foreground">
            {e.description ?? '-'}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        sortable: true,
        className: 'text-right',
        render: (e) => <Amount value={Number(e.amount)} />,
      },
      {
        key: 'isRecurring',
        header: 'Recurring',
        hideOnMobile: true,
        render: (e) =>
          e.isRecurring ? (
            <StatusBadge variant="info">Recurring</StatusBadge>
          ) : (
            <span className="text-xs text-muted-foreground">No</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        render: (e) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(ev) => {
              ev.stopPropagation()
              setDeleteTarget(e)
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ),
      },
    ],
    [],
  )

  const mobileCard = useCallback(
    (expense: Expense) => (
      <Card size="sm">
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatDate(expense.date)}</span>
                <StatusBadge variant="default">{expense.category}</StatusBadge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {expense.description ?? '-'}
              </p>
            </div>
            <Amount value={Number(expense.amount)} className="text-sm" />
          </div>
        </CardContent>
      </Card>
    ),
    [],
  )

  const isEmpty = !isLoading && items.length === 0 && !categoryFilter

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link to="/accounting/expenses/new" search={{ edit: undefined }}>
          <Button>
            <Plus className="mr-1 size-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Monthly Total */}
      {items.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Receipt className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total for Period</p>
              <p className="text-lg font-semibold">{formatIndianCurrency(monthlyTotal)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val === '__all__' ? '' : (val ?? ''))
            setOffset(0)
          }}
        >
          <SelectTrigger className="min-w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range)
            setOffset(0)
          }}
        />
      </div>

      {/* Data */}
      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Track your business expenses here."
          action={{
            label: 'Add Expense',
            onClick: () => navigate({ to: '/accounting/expenses/new', search: { edit: undefined } }),
          }}
        />
      ) : (
        <>
          <DataTable<Expense>
            data={items}
            columns={columns}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyMessage="No expenses match your filters"
            mobileCard={mobileCard}
          />

          {/* Pagination */}
          {(offset > 0 || hasMore) && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Expense"
        description={`Are you sure you want to delete this ${deleteTarget?.category ?? ''} expense of ${deleteTarget ? formatIndianCurrency(Number(deleteTarget.amount)) : ''}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id)
          }
        }}
      />
    </div>
  )
}
