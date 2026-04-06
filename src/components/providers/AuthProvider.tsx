import { createContext, useContext, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types/enums';
import type { User } from '@/types/models';

// ── Types ──

const AUTH_STORAGE_KEY = 'inventrack-auth';

interface AuthData {
  accessToken: string;
  user: User;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

// ── Helpers ──

function getStoredAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthData;
    if (!parsed.accessToken || !parsed.user) return null;

    return parsed;
  } catch {
    return null;
  }
}

// ── Auth Context ──

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  accessToken: null,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ── AuthGuard ──
// Wraps routes that require authentication.
// Reads auth state from localStorage on every render so it stays
// in sync even after another tab logs out.

export function AuthGuard() {
  const auth = getStoredAuth();

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!auth,
      user: auth?.user ?? null,
      accessToken: auth?.accessToken ?? null,
    }),
    // Re-derive when the serialised token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth?.accessToken],
  );

  // Not authenticated → redirect to login
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthContext.Provider value={value}>
      <Outlet />
    </AuthContext.Provider>
  );
}

// ── Loading skeleton shown while auth state resolves ──

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

// ── RoleGuard ──
// Accepts an array of allowed roles. If the current user's role is
// not in the list, redirect to /dashboard.

interface RoleGuardProps {
  roles: Role[];
  children?: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth();

  // Still loading or not authenticated (AuthGuard should catch this,
  // but be defensive)
  if (!user) {
    return <AuthLoadingSkeleton />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render explicit children if provided, otherwise render
  // nested <Route> elements via Outlet.
  return children ? <>{children}</> : <Outlet />;
}
