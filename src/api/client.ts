import ky from 'ky';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';

/**
 * API client with JWT auth interceptor.
 *
 * - beforeRequest: injects Authorization header from auth store
 * - afterResponse: on 401, attempts token refresh then retries original request
 */
export const api = ky.create({
  prefixUrl: env.API_BASE_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Auto-refresh on 401 (skip if the failing request was itself a refresh)
        if (response.status === 401 && !request.url.includes('/auth/refresh')) {
          const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

          if (!refreshToken) {
            logout();
            return;
          }

          try {
            const res = await ky
              .post(`${env.API_BASE_URL}/auth/refresh`, {
                json: { refreshToken },
              })
              .json<{ data: { accessToken: string } }>();

            const newToken = res.data.accessToken;
            setAccessToken(newToken);

            // Retry the original request with the new token
            request.headers.set('Authorization', `Bearer ${newToken}`);
            return ky(request);
          } catch {
            // Refresh failed — force logout
            logout();
          }
        }
      },
    ],
  },
});
