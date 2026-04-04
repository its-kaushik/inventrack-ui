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
  getCustomer,
  createCustomer,
  updateCustomer,
} from '@/api/customers.api'
import { Skeleton } from '@/components/data/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CustomerSearchParams {
  edit?: string
}

export const Route = createFileRoute('/_app/customers/new')({
  component: CustomerFormPage,
  validateSearch: (search: Record<string, unknown>): CustomerSearchParams => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
  }),
})

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

const defaultValues: CustomerFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

function CustomerFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { edit: editId } = Route.useSearch()
  const isEditMode = !!editId

  const { data: existingCustomer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: queryKeys.customers.detail(editId ?? ''),
    queryFn: () => getCustomer(editId!).then((res) => res.data),
    enabled: isEditMode,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  useEffect(() => {
    if (existingCustomer) {
      reset({
        name: existingCustomer.name,
        phone: existingCustomer.phone,
        email: existingCustomer.email ?? '',
        address: existingCustomer.address ?? '',
      })
    }
  }, [existingCustomer, reset])

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormValues) =>
      createCustomer({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() })
      toast.success('Customer created.')
      navigate({ to: '/customers' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create customer.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormValues) =>
      updateCustomer(editId!, {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(editId!),
      })
      toast.success('Customer updated.')
      navigate({ to: '/customers' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update customer.',
      )
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(data: CustomerFormValues) {
    if (isEditMode) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (isEditMode && isLoadingCustomer) {
    return <FormSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/customers">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Customer' : 'Create Customer'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? 'Update the customer details below.'
              : 'Fill in the customer details to add them to your records.'}
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
            Customer Information
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Priya Sharma"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="e.g. 9876543210"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. customer@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
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
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            {isEditMode ? 'Update Customer' : 'Create Customer'}
          </Button>
          <Link to="/customers">
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
          <Skeleton className="h-8 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
