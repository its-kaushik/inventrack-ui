import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignup, useInvite } from '@/hooks/use-auth';
import { phoneSchema, requiredString } from '@/lib/validators';

const signupSchema = z
  .object({
    name: requiredString,
    phone: phoneSchema,
    email: z.string().email('Invalid email').or(z.literal('')).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function StaffSignupPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const invite = useInvite(inviteToken ?? '');
  const signupMutation = useSignup();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = handleSubmit((data) => {
    if (!inviteToken) return;
    signupMutation.mutate({
      inviteToken,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      password: data.password,
    });
  });

  // Loading invite details
  if (invite.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  // Invalid/expired invite
  if (invite.isError || !inviteToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm rounded-card bg-white p-6 text-center shadow-card">
          <h2 className="text-xl font-semibold text-neutral-800">Invalid Invite</h2>
          <p className="mt-2 text-sm text-neutral-500">
            This invite link is invalid or has expired. Please ask your store owner for a new invite.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-6 touch-target">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary-600">InvenTrack</h1>
          {invite.data && (
            <p className="mt-1 text-sm text-neutral-500">
              Join <span className="font-medium text-neutral-700">{invite.data.tenantName}</span>
            </p>
          )}
        </div>

        {/* Signup Card */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-800">Create Account</h2>
            {invite.data && (
              <StatusBadge status="blue" label={invite.data.role} />
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                autoComplete="name"
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-error-500" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit phone number"
                autoComplete="tel"
                maxLength={10}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <p id="phone-error" className="text-sm text-error-500" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-neutral-400">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-error-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="pr-10"
                  aria-describedby={errors.password ? 'pwd-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="pwd-error" className="text-sm text-error-500" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                aria-describedby={errors.confirmPassword ? 'cpwd-error' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="cpwd-error" className="text-sm text-error-500" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* API Error */}
            {signupMutation.isError && (
              <p className="rounded-btn bg-error-50 px-3 py-2 text-sm text-error-700" role="alert">
                Signup failed. The invite may have expired or already been used.
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full touch-target"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
