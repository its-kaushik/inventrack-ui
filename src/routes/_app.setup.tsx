import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Store,
  Shield,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { FormStepper } from '@/components/form/form-stepper'
import { completeSetupWizard } from '@/api/settings.api'
import { createUser } from '@/api/users.api'
import type { UserRole } from '@/types/enums'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/setup')({
  component: SetupWizardPage,
})

// ---------- Schemas ----------

const storeSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
})
type StoreFormValues = z.infer<typeof storeSchema>

const gstSchema = z.object({
  gstScheme: z.enum(['regular', 'composition']),
  gstin: z.string().max(15, 'GSTIN must be at most 15 characters').optional().or(z.literal('')),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  fyStartMonth: z.string().min(1, 'Select a financial year start month'),
})
type GstFormValues = z.infer<typeof gstSchema>

const staffMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['manager', 'salesperson']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type StaffMemberValues = z.infer<typeof staffMemberSchema>

// ---------- Constants ----------

const WIZARD_STEPS = [
  { label: 'Store Details' },
  { label: 'GST Config' },
  { label: 'Team' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------- Main Page ----------

function SetupWizardPage() {
  const [step, setStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Collected data across steps
  const [storeData, setStoreData] = useState<StoreFormValues | null>(null)
  const [gstData, setGstData] = useState<GstFormValues | null>(null)
  const [addedStaff, setAddedStaff] = useState<StaffMemberValues[]>([])

  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setTenant = useAuthStore((s) => s.setTenant)

  const completeMutation = useMutation({
    mutationFn: completeSetupWizard,
  })

  function handleStoreNext(data: StoreFormValues) {
    setStoreData(data)
    setStep(1)
  }

  function handleGstNext(data: GstFormValues) {
    setGstData(data)
    setStep(2)
  }

  async function handleFinish() {
    if (!storeData || !gstData) return

    try {
      // Update store settings (tenant already exists after login)
      const { updateStoreSettings } = await import('@/api/settings.api')
      const result = await updateStoreSettings({
        name: storeData.storeName,
        gstScheme: gstData.gstScheme as 'regular' | 'composition',
        gstin: gstData.gstin || undefined,
        invoicePrefix: gstData.invoicePrefix,
      })
      if (result.data) setTenant(result.data as import('@/types/models').Tenant)

      // Create staff members
      for (const member of addedStaff) {
        try {
          await createUser({
            name: member.name,
            phone: member.phone,
            role: member.role as UserRole,
            password: member.password,
          })
        } catch {
          toast.error(`Failed to create user ${member.name}`)
        }
      }

      await completeMutation.mutateAsync()
      setIsComplete(true)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Setup failed. Please try again.',
      )
    }
  }

  function handleGoToDashboard() {
    navigate({ to: '/' })
  }

  if (isComplete) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">You're All Set!</h1>
            <p className="text-muted-foreground">
              Your store is configured and ready to go. Start managing your inventory now.
            </p>
            <Button size="lg" className="mt-2 w-full" onClick={handleGoToDashboard}>
              Go to Dashboard
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Setup Your Store</h1>
          <p className="text-sm text-muted-foreground">
            Complete these steps to get started with InvenTrack
          </p>
        </div>

        <div className="flex justify-center">
          <FormStepper steps={WIZARD_STEPS} currentStep={step} />
        </div>

        <Card>
          <CardContent>
            {step === 0 && (
              <StoreDetailsStep
                defaultValues={storeData}
                ownerName={user?.name ?? ''}
                ownerPhone={user?.phone ?? ''}
                onNext={handleStoreNext}
              />
            )}
            {step === 1 && (
              <GstConfigStep
                defaultValues={gstData}
                onNext={handleGstNext}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <TeamStep
                addedStaff={addedStaff}
                setAddedStaff={setAddedStaff}
                onBack={() => setStep(1)}
                onFinish={handleFinish}
                isSubmitting={completeMutation.isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------- Step 1: Store Details ----------

function StoreDetailsStep({
  defaultValues,
  ownerName,
  ownerPhone,
  onNext,
}: {
  defaultValues: StoreFormValues | null
  ownerName: string
  ownerPhone: string
  onNext: (data: StoreFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: defaultValues ?? {
      storeName: '',
      email: '',
      address: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Store className="size-5 text-primary" />
        Store Details
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storeName">Store Name *</Label>
          <Input
            id="storeName"
            placeholder="e.g. KVB Footwear"
            aria-invalid={!!errors.storeName}
            {...register('storeName')}
          />
          {errors.storeName && (
            <p className="text-xs text-destructive">{errors.storeName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Owner Name</Label>
          <Input value={ownerName} disabled className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={ownerPhone} disabled className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
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

        <div className="space-y-2">
          <Label htmlFor="address">Address (optional)</Label>
          <Input
            id="address"
            placeholder="Shop No. 1, Main Road, City"
            {...register('address')}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit">
          Next
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </form>
  )
}

// ---------- Step 2: GST Configuration ----------

function GstConfigStep({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: GstFormValues | null
  onNext: (data: GstFormValues) => void
  onBack: () => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GstFormValues>({
    resolver: zodResolver(gstSchema),
    defaultValues: defaultValues ?? {
      gstScheme: 'regular',
      gstin: '',
      invoicePrefix: '',
      fyStartMonth: 'April',
    },
  })

  const selectedScheme = watch('gstScheme')
  const selectedMonth = watch('fyStartMonth')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Shield className="size-5 text-primary" />
        GST Configuration
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>GST Scheme *</Label>
          <RadioGroup
            value={selectedScheme}
            onValueChange={(val) => setValue('gstScheme', val as 'regular' | 'composition')}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor="scheme-regular"
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                selectedScheme === 'regular'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="regular" id="scheme-regular" className="mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-medium">Regular</span>
                <p className="text-xs text-muted-foreground">
                  File GSTR-1, GSTR-3B. Charge GST on invoices. Claim Input Tax Credit.
                </p>
              </div>
            </label>

            <label
              htmlFor="scheme-composition"
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                selectedScheme === 'composition'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="composition" id="scheme-composition" className="mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-medium">Composition</span>
                <p className="text-xs text-muted-foreground">
                  File CMP-08/GSTR-4. Issue Bill of Supply. Cannot charge or claim GST separately.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN (optional)</Label>
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

        <div className="space-y-2">
          <Label>Financial Year Start Month *</Label>
          <Select
            value={selectedMonth}
            onValueChange={(val) => setValue('fyStartMonth', val as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fyStartMonth && (
            <p className="text-xs text-destructive">{errors.fyStartMonth.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <Button type="submit">
          Next
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </form>
  )
}

// ---------- Step 3: Team ----------

function TeamStep({
  addedStaff,
  setAddedStaff,
  onBack,
  onFinish,
  isSubmitting,
}: {
  addedStaff: StaffMemberValues[]
  setAddedStaff: React.Dispatch<React.SetStateAction<StaffMemberValues[]>>
  onBack: () => void
  onFinish: () => void
  isSubmitting: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const user = useAuthStore((s) => s.user)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StaffMemberValues>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: {
      name: '',
      phone: '',
      role: 'salesperson',
      password: '',
    },
  })

  const selectedRole = watch('role')

  function handleAddStaff(data: StaffMemberValues) {
    setAddedStaff((prev) => [...prev, data])
    reset()
    setShowForm(false)
  }

  function handleRemoveStaff(index: number) {
    setAddedStaff((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Users className="size-5 text-primary" />
        Team Setup
      </div>

      {/* Owner account */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name ?? 'Owner'}</p>
            <p className="text-xs text-muted-foreground">
              Owner account &mdash; already created
            </p>
          </div>
        </div>
      </div>

      {/* Added staff list */}
      {addedStaff.length > 0 && (
        <div className="space-y-2">
          {addedStaff.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.phone} &middot;{' '}
                  <span className="capitalize">{member.role}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveStaff(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add staff form */}
      {showForm ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Add Staff Member</CardTitle>
            <CardDescription>They can log in and use the POS.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="add-staff-form"
              onSubmit={handleSubmit(handleAddStaff)}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="staff-name">Name *</Label>
                <Input
                  id="staff-name"
                  placeholder="Staff member name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-phone">Phone *</Label>
                <Input
                  id="staff-phone"
                  type="tel"
                  placeholder="10-digit phone number"
                  aria-invalid={!!errors.phone}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setValue('role', val as 'manager' | 'salesperson')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="salesperson">Salesperson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-password">Password *</Label>
                <Input
                  id="staff-password"
                  type="password"
                  placeholder="Min 6 characters"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" form="add-staff-form">
                  Add Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reset()
                    setShowForm(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 size-4" />
          Add Staff Member
        </Button>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onFinish}
            disabled={isSubmitting}
          >
            {addedStaff.length === 0 ? 'Skip for now' : 'Finish Setup'}
          </Button>
          {addedStaff.length > 0 && (
            <Button
              type="button"
              onClick={onFinish}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
