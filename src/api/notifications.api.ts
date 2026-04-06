import { api } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Notification } from '@/types/models';

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: string;
}

export const notificationsApi = {
  list: (params?: NotificationListParams) =>
    api.get('notifications', { searchParams: params as Record<string, string> }).json<PaginatedResponse<Notification>>(),

  markAsRead: (id: string) =>
    api.patch(`notifications/${id}/read`).json<ApiResponse<Notification>>(),

  markAllAsRead: () =>
    api.post('notifications/mark-all-read').json<ApiResponse<{ count: number }>>(),
};
