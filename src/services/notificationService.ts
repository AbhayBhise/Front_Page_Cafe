import { api } from '../lib/api';
import type { Notification } from '../types';

export const notificationService = {
  list: () =>
    api.get('/notifications') as unknown as Promise<{ data: Notification[]; meta: { unread: number } }>,
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};
