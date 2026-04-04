import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import {
  getSupplier,
  createSupplier,
  updateSupplier,
} from '@/api/suppliers.api'
import { Skeleton } from '@/components/data/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SupplierSearchParams {
  edit?: string
}

export const Route = createFileRoute('/_app/suppliers/new')({
  component: SupplierFormPage,
  validateSearch: (search: Record<string, unknown>): SupplierSearchParams => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
  }),
})

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z
    .string()
    .max(15, 'GSTIN must be at most 15 characters')
    .optional()
    .or(z.literal('')),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

const defaultValues: SupplierFormValues = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  paymentTerms: '',
  notes: '',
}

function SupplierFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { edit: editId } = Route.useSearch()
  const isEditMode = !!editId

  const { data: existingSupplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: queryKeys.suppliers.detail(editId ?? ''),
    queryFn: () => getSupplier(editId!).then((res) => res.data),
    enabled: isEditMode,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  })

  useEffect(() => {
    if (existingSupplier) {
      reset({
        name: existingSupplier.name,
        contactPerson: existingSupplier.contactPerson ?? '',
        phone: existingSupplier.phone ?? '',
        email: existingSupplier.email ?? '',
        address: existingSupplier.address ?? '',
        gstin: existingSupplier.gstin ?? '',
        paymentTerms: existingSupplier.paymentTerms ?? '',
        notes: existingSupplier.notes ?? '',
      })
    }
  }, [existingSupplier, reset])

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormValues) =>
      createSupplier({
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        gstin: data.gstin || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
      toast.success('Supplier created.')
      navigate({ to: '/suppliers' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create supplier.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormValues) =>
      updateSupplier(editId!, {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        gstin: data.gstin || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(editId!),
      })
      toast.success('Supplier updated.')
      navigate({ to: '/suppliers' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update supplier.',
      )
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(data: SupplierFormValues) {
    if (isEditMode) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (isEditMode && isLoadingSupplier) {
    return <FormSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/suppliers">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Supplier' : 'Create Supplier'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? 'Update the supplier details below.'
              : 'Fill in the supplier details to add them to your records.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Supplier Information
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. ABC Traders"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="e.g. Ramesh Kumar"
                {...register('contactPerson')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="e.g. 9876543210"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. supplier@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                placeholder="e.g. 29ABCDE1234F1Z5"
                maxLength={15}
                aria-invalid={!!errors.gstin}
                {...register('gstin')}
              />
              {errors.gstin && (
                <p className="text-xs text-destructive">
                  {errors.gstin.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Full address..."
              {...register('address')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              placeholder="e.g. Net 30, COD"
              {...register('paymentTerms')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              {...register('notes')}
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {isEditMode ? 'Update Supplier' : 'Create Supplier'}
          </Button>
          <Link to="/suppliers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
