import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Store, Upload } from 'lucide-react'
import { queryKeys } from '@/api/query-keys'
import { getStoreSettings, updateStoreSettings } from '@/api/settings.api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useEffect } from 'react'

const storeSettingsSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstin: z.string().max(15, 'GSTIN must be at most 15 characters').optional().or(z.literal('')),
  gstScheme: z.enum(['regular', 'composition']),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
})

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>

export const Route = createFileRoute('/_app/settings/store')({
  component: StoreSettingsPage,
})

function StoreSettingsPage() {
  const queryClient = useQueryClient()

  const { data: store, isLoading } = useQuery({
    queryKey: queryKeys.storeSettings(),
    queryFn: () => getStoreSettings().then((res) => res.data),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
      gstScheme: 'regular',
      invoicePrefix: '',
    },
  })

  useEffect(() => {
    if (store) {
      reset({
        name: store.name ?? '',
        address: '',
        phone: '',
        email: '',
        gstin: store.gstin ?? '',
        gstScheme: store.gstScheme ?? 'regular',
        invoicePrefix: store.invoicePrefix ?? '',
      })
    }
  }, [store, reset])

  const selectedScheme = watch('gstScheme')

  const mutation = useMutation({
    mutationFn: (data: StoreSettingsFormValues) =>
      updateStoreSettings({
        name: data.name,
        gstScheme: data.gstScheme,
        gstin: data.gstin || null,
        invoicePrefix: data.invoicePrefix,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeSettings() })
      toast.success('Store settings updated.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings.')
    },
  })

  function onSubmit(data: StoreSettingsFormValues) {
    mutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/settings">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your store profile and GST configuration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="size-5 text-primary" />
              <CardTitle>Store Profile</CardTitle>
            </div>
            <CardDescription>Basic information about your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Store phone number"
                  {...register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="store@example.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Store address"
                {...register('address')}
              />
            </div>

            {/* Logo upload placeholder */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                  <Upload className="size-6 text-muted-foreground/50" />
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" disabled>
                    Upload Logo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coming soon. PNG or JPG, max 1MB.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>GST Configuration</CardTitle>
            <CardDescription>Configure your GST scheme and invoice settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>GST Scheme *</Label>
              <RadioGroup
                value={selectedScheme}
                onValueChange={(val) => setValue('gstScheme', val as 'regular' | 'composition', { shouldDirty: true })}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label
                  htmlFor="store-scheme-regular"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    selectedScheme === 'regular'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="regular" id="store-scheme-regular" className="mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Regular</span>
                    <p className="text-xs text-muted-foreground">
                      File GSTR-1, GSTR-3B. Charge GST on invoices. Claim Input Tax Credit.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="store-scheme-composition"
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    selectedScheme === 'composition'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="composition" id="store-scheme-composition" className="mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Composition</span>
                    <p className="text-xs text-muted-foreground">
                      File CMP-08/GSTR-4. Issue Bill of Supply. Cannot charge or claim GST separately.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  maxLength={15}
                  aria-invalid={!!errors.gstin}
                  {...register('gstin')}
                />
                {errors.gstin && (
                  <p className="text-xs text-destructive">{errors.gstin.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix *</Label>
                <Input
                  id="invoicePrefix"
                  placeholder='e.g. "KVB"'
                  aria-invalid={!!errors.invoicePrefix}
                  {...register('invoicePrefix')}
                />
                {errors.invoicePrefix && (
                  <p className="text-xs text-destructive">{errors.invoicePrefix.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
