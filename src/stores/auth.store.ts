import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@/types/enums';

export interface AuthUser {
  id: string;
  name: string;
  tenantId: string | null;
  role: Role;
  email: string | null;
  phone: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  login: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
          isAuthenticated: true,
        }),

      logout: () => {
        // Clear cart store to prevent session leakage between users
        // (cart store import would be circular, so we clear via sessionStorage key)
        try {
          sessionStorage.removeItem('inventrack-cart');
        } catch {
          // Ignore if sessionStorage is unavailable
        }

        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'inventrack-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
