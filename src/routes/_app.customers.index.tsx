import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { listCustomers } from '@/api/customers.api'
import type { Customer } from '@/types/models'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { SearchInput } from '@/components/form/search-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/_app/customers/')({
  component: CustomerListPage,
})

function CustomerListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [withBalance, setWithBalance] = useState(false)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      with_balance: withBalance || undefined,
    }),
    [search, withBalance],
  )

  const { data: customersData, isLoading } = useQuery({
    queryKey: queryKeys.customers.list(filters as Record<string, unknown>),
    queryFn: () => listCustomers(filters).then((res) => res.data),
  })

  const customers = customersData?.items ?? []

  const handleRowClick = useCallback(
    (customer: Customer) => {
      navigate({ to: '/customers/$id', params: { id: customer.id } })
    },
    [navigate],
  )

  const columns: Column<Customer>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (c) => (
          <div>
            <p className="font-medium">{c.name}</p>
            {c.email && (
              <p className="text-xs text-muted-foreground">{c.email}</p>
            )}
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (c) => (
          <span className="font-mono text-sm">{c.phone}</span>
        ),
      },
      {
        key: 'outstandingBalance',
        header: 'Outstanding',
        sortable: true,
        className: 'text-right',
        render: (c) => {
          const bal = parseFloat(c.outstandingBalance ?? '0')
          return (
            <Amount
              value={bal}
              className={bal > 0 ? 'text-red-600 dark:text-red-400' : ''}
            />
          )
        },
      },
      {
        key: 'actions',
        header: '',
        render: (c) => (
          <Link
            to="/customers/$id"
            params={{ id: c.id }}
            className="text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        ),
      },
    ],
    [],
  )

  const mobileCard = useCallback(
    (customer: Customer) => {
      const bal = parseFloat(customer.outstandingBalance ?? '0')
      return (
        <Card size="sm">
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.phone}
                </p>
              </div>
              <Amount
                value={bal}
                className={
                  bal > 0
                    ? 'text-sm text-red-600 dark:text-red-400'
                    : 'text-sm'
                }
              />
            </div>
          </CardContent>
        </Card>
      )
    },
    [],
  )

  const isEmpty =
    !isLoading && customers.length === 0 && !search && !withBalance

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link to="/customers/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <Switch
            checked={withBalance}
            onCheckedChange={setWithBalance}
          />
          <Label className="text-sm cursor-pointer">With Balance</Label>
        </div>
      </div>

      {/* Table / Empty */}
      {isEmpty ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start tracking credit and payments."
          action={{
            label: 'Add Customer',
            onClick: () => navigate({ to: '/customers/new' }),
          }}
        />
      ) : (
        <DataTable<Customer>
          data={customers}
          columns={columns}
          onRowClick={handleRowClick}
          loading={isLoading}
          emptyMessage="No customers match your search"
          mobileCard={mobileCard}
        />
      )}
    </div>
  )
}
