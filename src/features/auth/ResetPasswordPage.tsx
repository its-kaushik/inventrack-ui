import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForgotPassword, useResetPassword } from '@/hooks/use-auth';

// ── Step 1: Request reset ──

const requestSchema = z.object({
  emailOrPhone: z.string().min(1, 'Phone or email is required'),
});

// ── Step 2: New password ──

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RequestFormData = z.infer<typeof requestSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type Step = 'request' | 'reset' | 'done';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // If URL has a token, skip straight to step 2
  const [step, setStep] = useState<Step>(token ? 'reset' : 'request');

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">InvenTrack</h1>
        </div>

        <div className="rounded-card bg-white p-6 shadow-card">
          {step === 'request' && <RequestStep onSuccess={() => setStep('done')} />}
          {step === 'reset' && <ResetStep token={token ?? ''} onSuccess={() => setStep('done')} />}
          {step === 'done' && <DoneStep />}
        </div>
      </div>
    </div>
  );
}

// ── Request Step ──

function RequestStep({ onSuccess }: { onSuccess: () => void }) {
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data, { onSuccess });
  });

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold text-neutral-800">Reset Password</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Enter your phone number or email and we'll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="emailOrPhone">Phone or Email</Label>
          <Input
            id="emailOrPhone"
            type="text"
            placeholder="Enter phone number or email"
            aria-describedby={errors.emailOrPhone ? 'req-error' : undefined}
            {...register('emailOrPhone')}
          />
          {errors.emailOrPhone && (
            <p id="req-error" className="text-sm text-error-500" role="alert">
              {errors.emailOrPhone.message}
            </p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full touch-target" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <ArrowLeft className="size-3.5" /> Back to login
        </Link>
      </div>
    </>
  );
}

// ── Reset Step ──

function ResetStep({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const mutation = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate({ token, newPassword: data.newPassword }, { onSuccess });
  });

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold text-neutral-800">Set New Password</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Enter your new password below.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            aria-describedby={errors.newPassword ? 'np-error' : undefined}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p id="np-error" className="text-sm text-error-500" role="alert">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-describedby={errors.confirmPassword ? 'cp-error' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p id="cp-error" className="text-sm text-error-500" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <p className="rounded-btn bg-error-50 px-3 py-2 text-sm text-error-700" role="alert">
            Failed to reset password. The link may have expired.
          </p>
        )}

        <Button type="submit" className="h-11 w-full touch-target" disabled={mutation.isPending}>
          {mutation.isPending ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>
    </>
  );
}

// ── Done Step ──

function DoneStep() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CheckCircle className="size-12 text-success-500" />
      <h2 className="text-xl font-semibold text-neutral-800">Check your phone/email</h2>
      <p className="text-sm text-neutral-500">
        If an account exists with that phone or email, we've sent a password reset link.
      </p>
      <Link to="/login">
        <Button variant="outline" className="mt-4 touch-target">
          Back to Login
        </Button>
      </Link>
    </div>
  );
}
