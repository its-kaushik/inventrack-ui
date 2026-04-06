import { api } from './client';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/models';
import type { AuthUser } from '@/stores/auth.store';

// ── Request types ──

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ForgotPasswordRequest {
  emailOrPhone: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface SignupRequest {
  inviteToken: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  user: User;
}

// ── API functions ──

export const authApi = {
  login: (data: LoginRequest) =>
    api.post('auth/login', { json: data }).json<ApiResponse<LoginResponse>>(),

  refresh: (refreshToken: string) =>
    api.post('auth/refresh', { json: { refreshToken } }).json<ApiResponse<{ accessToken: string }>>(),

  logout: (refreshToken: string) =>
    api.post('auth/logout', { json: { refreshToken } }),

  me: () =>
    api.get('auth/me').json<ApiResponse<User>>(),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post('auth/forgot-password', { json: data }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post('auth/reset-password', { json: data }),

  signup: (data: SignupRequest) =>
    api.post('auth/signup', { json: data }).json<ApiResponse<SignupResponse>>(),

  getInvite: (token: string) =>
    api.get(`auth/invite/${token}`).json<ApiResponse<{ email: string; role: string; tenantName: string }>>(),
};
