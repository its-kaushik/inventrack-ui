import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { useMe } from '@/hooks/use-auth';
import type { Role } from '@/types/enums';

// ── AuthGuard ──
// Wraps routes that require authentication.
// Reads auth state from Zustand (persisted in localStorage).
// Validates the stored token via /auth/me on mount.

export function AuthGuard() {
  const { isAuthenticated } = useAuthStore();
  const { isLoading, isError } = useMe();

  // Not authenticated → redirect to login
  if (!isAuthenticated || isError) {
    return <Navigate to="/login" replace />;
  }

  // Token is being validated
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  return <Outlet />;
}

// ── RoleGuard ──
// Accepts an array of allowed roles. If the current user's role is
// not in the list, redirect to /dashboard.

interface RoleGuardProps {
  roles: Role[];
  children?: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuthStore();

  // Still loading (AuthGuard should catch this, but be defensive)
  if (!user) {
    return <AuthLoadingSkeleton />;
  }

  if (!roles.includes(user.role)) {
    const fallback = user.role === 'super_admin' ? '/admin/tenants' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

// ── useAuth hook ──
// Convenience hook to access auth state from components.

export function useAuth() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  return { isAuthenticated, user, accessToken };
}

// ── Loading skeleton ──

function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid w-full max-w-md gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
