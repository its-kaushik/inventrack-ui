import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Phone or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Already logged in → redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">InvenTrack</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Retail Inventory & POS Management
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <h2 className="mb-6 text-xl font-semibold text-neutral-800">
            Sign in to your account
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email/Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="emailOrPhone">Phone or Email</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="Enter phone number or email"
                autoComplete="username"
                aria-describedby={errors.emailOrPhone ? 'emailOrPhone-error' : undefined}
                {...register('emailOrPhone')}
              />
              {errors.emailOrPhone && (
                <p id="emailOrPhone-error" className="text-sm text-error-500" role="alert">
                  {errors.emailOrPhone.message}
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                  aria-describedby={errors.password ? 'password-error' : undefined}
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
                <p id="password-error" className="text-sm text-error-500" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* API Error */}
            {loginMutation.isError && (
              <p className="rounded-btn bg-error-50 px-3 py-2 text-sm text-error-700" role="alert">
                Invalid phone/email or password. Please try again.
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full touch-target"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <Link
              to="/reset-password"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
