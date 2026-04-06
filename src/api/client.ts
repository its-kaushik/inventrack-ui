import ky from 'ky';
import { env } from '@/config/env';

/**
 * API client with JWT auth interceptor.
 * Auth store integration (token injection + 401 auto-refresh) will be
 * wired in F3 when useAuthStore is built. For now, supports manual token.
 */
export const api = ky.create({
  prefixUrl: env.API_BASE_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        // Auth store will be integrated in F3
        const token = localStorage.getItem('inventrack-access-token');
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
  },
});
