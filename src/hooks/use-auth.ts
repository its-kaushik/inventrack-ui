import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginRequest, type ForgotPasswordRequest, type ResetPasswordRequest, type SignupRequest } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

/** Validate stored token on app load — fetches current user profile. */
export function useMe() {
  const { isAuthenticated, logout } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authApi.me();
      return res.data;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      // If this fails with 401, the interceptor will try refresh.
      // If refresh also fails, logout happens automatically.
      onError: () => logout(),
    },
  });
}

/** Login mutation. */
export function useLogin() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data;
      login({ accessToken, refreshToken }, user);
      queryClient.clear();
      const dest = user.role === 'super_admin' ? '/admin/tenants' : '/dashboard';
      navigate(dest, { replace: true });
    },
    onError: () => {
      // Error toast is handled by the mutation caller (for inline display)
    },
  });
}

/** Logout mutation. */
export function useLogout() {
  const { refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    },
    onSettled: () => {
      // Always log out locally, even if the API call fails
      logout();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

/** Forgot password mutation. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: () => {
      toast.success('Password reset link sent. Check your phone/email.');
    },
    onError: () => {
      toast.error('Unable to send reset link. Please try again.');
    },
  });
}

/** Reset password mutation. */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in.');
      navigate('/login', { replace: true });
    },
    onError: () => {
      toast.error('Failed to reset password. The link may have expired.');
    },
  });
}

/** Staff signup mutation. */
export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: () => {
      toast.success('Account created. Please log in.');
      navigate('/login', { replace: true });
    },
    onError: () => {
      toast.error('Signup failed. The invite may have expired.');
    },
  });
}

/** Fetch invite details by token. */
export function useInvite(token: string) {
  return useQuery({
    queryKey: ['auth', 'invite', token],
    queryFn: () => authApi.getInvite(token).then((r) => r.data),
    enabled: !!token,
    retry: false,
  });
}
