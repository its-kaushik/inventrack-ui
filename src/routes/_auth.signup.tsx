import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Store, Phone, Lock, Loader2, User, Mail } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { signupTenant } from '@/api/signup.api'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

const signupSchema = z
  .object({
    storeName: z.string().min(1, 'Business name is required'),
    ownerName: z.string().min(1, 'Owner name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    gstin: z.string().max(15).optional().or(z.literal('')),
    gstScheme: z.enum(['regular', 'composition']).optional(),
    terms: z.literal(true, 'You must agree to the Terms of Service'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
})

function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      storeName: '',
      ownerName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      email: '',
      address: '',
      gstin: '',
      gstScheme: undefined,
      terms: false as unknown as true,
    },
  })

  const selectedGstScheme = watch('gstScheme')

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    try {
      const res = await signupTenant({
        storeName: data.storeName,
        ownerName: data.ownerName,
        phone: data.phone,
        password: data.password,
        email: data.email || undefined,
        address: data.address || undefined,
        gstin: data.gstin || undefined,
        gstScheme: data.gstScheme || undefined,
      })
      const { owner, accessToken, tenant } = res.data
      setAuth(owner, accessToken, tenant)
      toast.success('Account created successfully!')
      navigate({ to: '/setup' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed. Please try again.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">InvenTrack</h1>
        <p className="text-muted-foreground text-sm">Create your business account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>
            Set up your store and start managing inventory in minutes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="storeName">Business / Store Name</Label>
              <div className="relative">
                <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="storeName"
                  placeholder="Enter your business name"
                  className="pl-8"
                  aria-invalid={!!errors.storeName}
                  {...register('storeName')}
                />
              </div>
              {errors.storeName && (
                <p className="text-xs text-destructive">{errors.storeName.message}</p>
              )}
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="ownerName"
                  placeholder="Enter your name"
                  className="pl-8"
                  aria-invalid={!!errors.ownerName}
                  {...register('ownerName')}
                />
              </div>
              {errors.ownerName && (
                <p className="text-xs text-destructive">{errors.ownerName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className="pl-8"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="pl-8 pr-9"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pl-8 pr-9"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-8"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Shop address" {...register('address')} />
            </div>

            {/* GSTIN */}
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                placeholder="e.g. 09ABCDE1234F1Z5"
                maxLength={15}
                {...register('gstin')}
              />
            </div>

            {/* GST Scheme */}
            <div className="space-y-2">
              <Label>GST Scheme</Label>
              <Controller
                control={control}
                name="gstScheme"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { value: 'regular' as const, label: 'Regular' },
                      { value: 'composition' as const, label: 'Composition' },
                    ].map((scheme) => (
                      <label
                        key={scheme.value}
                        htmlFor={`gst-${scheme.value}`}
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedGstScheme === scheme.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value={scheme.value} id={`gst-${scheme.value}`} />
                        <span className="text-sm font-medium">{scheme.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Controller
                control={control}
                name="terms"
                render={({ field }) => (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={!!errors.terms}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                      I agree to the Terms of Service
                    </Label>
                  </div>
                )}
              />
              {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            form="signup-form"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Create Account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
