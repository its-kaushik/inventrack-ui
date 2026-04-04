import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  Truck,
} from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import {
  getSupplier,
  getSupplierLedger,
  getSupplierProducts,
  recordSupplierPayment,
} from '@/api/suppliers.api'
import { listPurchases } from '@/api/purchases.api'
import type { SupplierPaymentMode } from '@/types/enums'
import type { Product, Purchase } from '@/types/models'
import { formatIndianCurrency } from '@/lib/format-currency'
import { Amount } from '@/components/data/amount'
import { LedgerRow } from '@/components/data/ledger-row'
import { Skeleton } from '@/components/data/loading-skeleton'
import { EmptyState } from '@/components/data/empty-state'
import { CurrencyInput } from '@/components/form/currency-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

export const Route = createFileRoute('/_app/suppliers/$id')({
  component: SupplierDetailPage,
})

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'card'] as const),
  paymentReference: z.string().optional(),
  description: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

function SupplierDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  const {
    data: supplier,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: () => getSupplier(id).then((res) => res.data),
  })

  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: queryKeys.suppliers.ledger(id),
    queryFn: () => getSupplierLedger(id).then((res) => res.data),
  })

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: queryKeys.suppliers.products(id),
    queryFn: () => getSupplierProducts(id).then((res) => res.data),
  })

  const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: queryKeys.purchases.list({ supplier_id: id }),
    queryFn: () =>
      listPurchases({ supplier_id: id }).then((res) => res.data),
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
      recordSupplierPayment(id, {
        amount: data.amount,
        paymentMode: data.paymentMode as SupplierPaymentMode,
        paymentReference: data.paymentReference || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.ledger(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(),
      })
      toast.success('Payment recorded successfully.')
      setPayDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to record payment.',
      )
    },
  })

  function onPaySubmit(data: PaymentFormValues) {
    paymentMutation.mutate(data)
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError || !supplier) {
    return (
      <div className="space-y-4">
        <Link to="/suppliers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Back to Suppliers
          </Button>
        </Link>
        <EmptyState
          icon={Truck}
          title="Supplier not found"
          description="The supplier you are looking for does not exist or has been removed."
          action={{
            label: 'Go to Suppliers',
            onClick: () => navigate({ to: '/suppliers' }),
          }}
        />
      </div>
    )
  }

  const balance = parseFloat(supplier.outstandingBalance ?? '0')
  const ledgerEntries = ledgerData?.items ?? []
  const purchases = purchasesData?.items ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/suppliers">
            <Button variant="ghost" size="icon-sm" className="mt-1">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {supplier.contactPerson && (
                <span>{supplier.contactPerson}</span>
              )}
              {supplier.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {supplier.phone}
                </span>
              )}
              {supplier.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {supplier.email}
                </span>
              )}
              {supplier.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {supplier.address}
                </span>
              )}
            </div>
            {supplier.gstin && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                GSTIN: {supplier.gstin}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset({ amount: 0, paymentMode: 'cash', paymentReference: '', description: '' })
              setPayDialogOpen(true)
            }}
          >
            <IndianRupee className="mr-1 size-3.5" />
            Record Payment
          </Button>
          <Link to="/suppliers/new" search={{ edit: supplier.id }}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 size-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Outstanding Balance Card */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Outstanding Balance
            </p>
            <p
              className={`text-2xl font-bold font-mono tabular-nums ${
                balance > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatIndianCurrency(balance)}
            </p>
          </div>
          {balance > 0 && (
            <Button
              onClick={() => {
                reset({
                  amount: 0,
                  paymentMode: 'cash',
                  paymentReference: '',
                  description: '',
                })
                setPayDialogOpen(true)
              }}
            >
              <IndianRupee className="mr-1 size-4" />
              Pay Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        {/* Ledger Tab */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLedger ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No ledger entries yet" />
                </div>
              ) : (
                <div>
                  {/* Header row */}
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>Date</span>
                    <span>Description</span>
                    <span className="text-right">Debit</span>
                    <span className="text-right">Credit</span>
                    <span className="text-right">Balance</span>
                  </div>
                  {ledgerEntries.map((entry) => (
                    <LedgerRow
                      key={entry.id}
                      date={new Date(entry.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                      description={entry.description}
                      debit={
                        entry.debit ? parseFloat(entry.debit) : undefined
                      }
                      credit={
                        entry.credit ? parseFloat(entry.credit) : undefined
                      }
                      balance={parseFloat(entry.runningBalance)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products Supplied</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState title="No products linked to this supplier" />
              ) : (
                <div className="divide-y">
                  {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <Amount value={product.costPrice} className="text-sm" />
                        <p className="text-xs text-muted-foreground">
                          Sell: <Amount value={product.sellingPrice} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPurchases ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <EmptyState title="No purchases from this supplier" />
              ) : (
                <div className="divide-y">
                  {purchases.map((purchase: Purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {purchase.invoiceNumber ?? 'No Invoice #'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {purchase.invoiceDate
                            ? new Date(
                                purchase.invoiceDate,
                              ).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : new Date(
                                purchase.createdAt,
                              ).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                        </p>
                      </div>
                      <Amount
                        value={parseFloat(purchase.totalAmount)}
                        className="text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {supplier.name}</DialogTitle>
            <DialogDescription>
              Outstanding: {formatIndianCurrency(balance)}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onPaySubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Mode *</Label>
              <Controller
                control={control}
                name="paymentMode"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-ref-detail">Reference</Label>
              <Input
                id="pay-ref-detail"
                placeholder="Transaction ID, cheque no., etc."
                {...register('paymentReference')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-notes-detail">Description</Label>
              <Input
                id="pay-notes-detail"
                placeholder="Optional note"
                {...register('description')}
              />
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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}
