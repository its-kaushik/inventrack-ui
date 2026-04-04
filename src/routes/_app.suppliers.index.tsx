import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Truck, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { queryKeys } from '@/api/query-keys'
import { listSuppliers, recordSupplierPayment } from '@/api/suppliers.api'
import type { Supplier } from '@/types/models'
import type { SupplierPaymentMode } from '@/types/enums'
import { DataTable } from '@/components/data/data-table'
import type { Column } from '@/components/data/data-table'
import { Amount } from '@/components/data/amount'
import { EmptyState } from '@/components/data/empty-state'
import { SearchInput } from '@/components/form/search-input'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/suppliers/')({
  component: SupplierListPage,
})

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'card'] as const),
  paymentReference: z.string().optional(),
  description: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

function SupplierListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: queryKeys.suppliers.list({ search: search || undefined }),
    queryFn: () => listSuppliers(search || undefined).then((res) => res.data),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMode: 'cash',
      paymentReference: '',
      description: '',
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (data: PaymentFormValues) =>
      recordSupplierPayment(selectedSupplier!.id, {
        amount: data.amount,
        paymentMode: data.paymentMode as SupplierPaymentMode,
        paymentReference: data.paymentReference || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
      if (selectedSupplier) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.suppliers.detail(selectedSupplier.id),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.suppliers.ledger(selectedSupplier.id),
        })
      }
      toast.success('Payment recorded successfully.')
      setPayDialogOpen(false)
      setSelectedSupplier(null)
      reset()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment.')
    },
  })

  function openPayDialog(supplier: Supplier, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    reset({ amount: 0, paymentMode: 'cash', paymentReference: '', description: '' })
    setPayDialogOpen(true)
  }

  function onPaySubmit(data: PaymentFormValues) {
    paymentMutation.mutate(data)
  }

  const handleRowClick = useCallback(
    (supplier: Supplier) => {
      navigate({ to: '/suppliers/$id', params: { id: supplier.id } })
    },
    [navigate],
  )

  const columns: Column<Supplier>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (s) => (
          <div>
            <p className="font-medium">{s.name}</p>
            {s.gstin && <p className="text-xs text-muted-foreground">GSTIN: {s.gstin}</p>}
          </div>
        ),
      },
      {
        key: 'contactPerson',
        header: 'Contact Person',
        hideOnMobile: true,
        render: (s) => s.contactPerson ?? '-',
      },
      {
        key: 'phone',
        header: 'Phone',
        hideOnMobile: true,
        render: (s) => s.phone ?? '-',
      },
      {
        key: 'outstandingBalance',
        header: 'Outstanding',
        sortable: true,
        className: 'text-right',
        render: (s) => {
          const bal = parseFloat(s.outstandingBalance ?? '0')
          return <Amount value={bal} className={bal > 0 ? 'text-red-600 dark:text-red-400' : ''} />
        },
      },
      {
        key: 'actions',
        header: '',
        render: (s) => {
          const bal = parseFloat(s.outstandingBalance ?? '0')
          return bal > 0 ? (
            <Button variant="outline" size="xs" onClick={(e) => openPayDialog(s, e)}>
              <IndianRupee className="mr-0.5 size-3" />
              Quick Pay
            </Button>
          ) : null
        },
      },
    ],
    [openPayDialog],
  )

  const mobileCard = useCallback(
    (supplier: Supplier) => {
      const bal = parseFloat(supplier.outstandingBalance ?? '0')
      return (
        <Card size="sm">
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{supplier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {supplier.contactPerson ?? supplier.phone ?? '-'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Amount
                  value={bal}
                  className={bal > 0 ? 'text-sm text-red-600 dark:text-red-400' : 'text-sm'}
                />
                {bal > 0 && (
                  <Button variant="outline" size="xs" onClick={(e) => openPayDialog(supplier, e)}>
                    Quick Pay
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    [openPayDialog],
  )

  const isEmpty = !isLoading && suppliers.length === 0 && !search

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Link to="/suppliers/new">
          <Button>
            <Plus className="mr-1 size-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search suppliers..."
        className="w-full sm:max-w-xs"
      />

      {/* Table / Empty */}
      {isEmpty ? (
        <EmptyState
          icon={Truck}
          title="No suppliers yet"
          description="Add your first supplier to get started."
          action={{
            label: 'Add Supplier',
            onClick: () => navigate({ to: '/suppliers/new' }),
          }}
        />
      ) : (
        <DataTable<Supplier>
          data={suppliers}
          columns={columns}
          onRowClick={handleRowClick}
          loading={isLoading}
          emptyMessage="No suppliers match your search"
          mobileCard={mobileCard}
        />
      )}

      {/* Quick Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Pay — {selectedSupplier?.name}</DialogTitle>
            <DialogDescription>Record a payment to this supplier.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onPaySubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
                )}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Mode *</Label>
              <Controller
                control={control}
                name="paymentMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Reference</Label>
              <Input
                id="pay-ref"
                placeholder="Transaction ID, cheque no., etc."
                {...register('paymentReference')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-notes">Description</Label>
              <Input id="pay-notes" placeholder="Optional note" {...register('description')} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={paymentMutation.isPending}>
                {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
