import { api, getData } from '../lib/api';
import type { Cafe, Paginated, User } from '../types';
import type { ActivityLog } from './cafeService';

export interface PlatformOverview {
  users: Record<string, number>;
  totalUsers: number;
  cafes: Record<string, number>;
  pendingApprovals: number;
  liveCafes: number;
  gmv: number;
  totalOrders: number;
  todayGmv: number;
  todayOrders: number;
}

export interface AdminCafe extends Cafe {
  owner: { id: string; name: string; email: string; phone?: string | null };
  _count: { orders: number; menuItems: number; staff: number };
}

export interface AdminUser extends User {
  _count: { orders: number; ownedCafes: number };
}

export const adminService = {
  overview: () => getData<PlatformOverview>('/admin/overview'),
  timeseries: (days = 14) =>
    getData<{ date: string; gmv: number; orders: number; signups: number }[]>('/admin/analytics/timeseries', {
      params: { days },
    }),
  cafes: (status?: string) => getData<AdminCafe[]>('/admin/cafes', { params: status ? { status } : {} }),
  reviewCafe: (cafeId: string, decision: 'approve' | 'reject' | 'suspend', reason?: string) =>
    api.post(`/admin/cafes/${cafeId}/review`, { decision, reason }) as unknown as Promise<{ data: Cafe }>,
  users: (params: { q?: string; role?: string; page?: number } = {}) =>
    api.get('/admin/users', { params }) as unknown as Promise<Paginated<AdminUser>>,
  updateUser: (id: string, body: { status?: 'active' | 'suspended'; role?: string }) =>
    api.patch(`/admin/users/${id}`, body) as unknown as Promise<{ data: User }>,
  activity: (params: { page?: number; action?: string } = {}) =>
    api.get('/admin/activity', { params }) as unknown as Promise<Paginated<ActivityLog>>,
};
