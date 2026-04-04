import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '@/api/auth.api'
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

const forgotPasswordSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsSubmitting(true)
    try {
      await forgotPassword(data.phone)
      setIsSuccess(true)
    } catch (error) {
      // Always show success message to prevent phone number enumeration
      setIsSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">InvenTrack</h1>
        </div>

        <Card>
          <CardContent className="text-center space-y-4 py-2">
            <CheckCircle2 className="size-12 text-primary mx-auto" />
            <div className="space-y-1">
              <p className="font-medium">Check your messages</p>
              <p className="text-sm text-muted-foreground">
                If an account exists with that phone number, you'll receive a
                reset link.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">InvenTrack</h1>
        <p className="text-muted-foreground text-sm">Reset your password</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your phone number and we'll send you a reset link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="forgot-password-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            form="forgot-password-form"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Send Reset Link
          </Button>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
