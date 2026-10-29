import { api, getData } from '../lib/api';
import { FALLBACK_CAFES, getFallbackCafes } from '../data/fallbackData';
import type {
  Cafe,
  CafeStaff,
  CafeTable,
  Counter,
  KitchenLoad,
  Order,
  Paginated,
  PresenceEntry,
} from '../types';

export const cafeService = {
  discover: async (params: { q?: string; city?: string; page?: number; pageSize?: number } = {}) => {
    try {
      const res = await (api.get('/cafes', { params }) as unknown as Promise<Paginated<Cafe>>);
      if (res && res.data && res.data.length > 0) return res;
      return getFallbackCafes(params);
    } catch {
      return getFallbackCafes(params);
    }
  },

  get: async (idOrSlug: string) => {
    try {
      return await getData<Cafe>(`/cafes/${idOrSlug}`);
    } catch {
      return (
        FALLBACK_CAFES.find((c) => c.slug === idOrSlug || c.id === idOrSlug) ||
        FALLBACK_CAFES[0]
      );
    }
  },

  mine: () => getData<Cafe & { counters: Counter[] }>('/cafes/mine'),

  patchCafe: (cafeId: string, patch: Record<string, unknown>) =>
    api.patch(`/cafes/${cafeId}`, patch) as unknown as Promise<{ data: Cafe }>,

  toggleOpen: (cafeId: string, isOpen: boolean) =>
    api.post(`/cafes/${cafeId}/toggle-open`, { isOpen }) as unknown as Promise<{ data: Cafe }>,

  // counters
  listCounters: (cafeId: string) => getData<Counter[]>(`/cafes/${cafeId}/counters`),
  createCounter: (cafeId: string, body: { name: string; code: string; isActive?: boolean }) =>
    api.post(`/cafes/${cafeId}/counters`, body) as unknown as Promise<{ data: Counter }>,
  updateCounter: (cafeId: string, counterId: string, body: Partial<Counter>) =>
    api.patch(`/cafes/${cafeId}/counters/${counterId}`, body) as unknown as Promise<{ data: Counter }>,
  deleteCounter: (cafeId: string, counterId: string) => api.delete(`/cafes/${cafeId}/counters/${counterId}`),

  // tables (QR)
  listTables: (cafeId: string) => getData<CafeTable[]>(`/cafes/${cafeId}/tables`),
  createTable: (cafeId: string, body: { label: string; code?: string }) =>
    api.post(`/cafes/${cafeId}/tables`, body) as unknown as Promise<{ data: CafeTable }>,
  updateTable: (cafeId: string, tableId: string, body: { label?: string; isActive?: boolean }) =>
    api.patch(`/cafes/${cafeId}/tables/${tableId}`, body) as unknown as Promise<{ data: CafeTable }>,
  rotateTable: (cafeId: string, tableId: string) =>
    api.post(`/cafes/${cafeId}/tables/${tableId}/rotate`, {}) as unknown as Promise<{ data: CafeTable }>,
  deleteTable: (cafeId: string, tableId: string) => api.delete(`/cafes/${cafeId}/tables/${tableId}`),

  // staff
  listStaff: (cafeId: string) => getData<CafeStaff[]>(`/cafes/${cafeId}/staff`),
  createStaff: (
    cafeId: string,
    body: { name: string; email: string; password: string; title?: string; counterId?: string | null },
  ) => api.post(`/cafes/${cafeId}/staff`, body) as unknown as Promise<{ data: CafeStaff }>,
  updateStaff: (cafeId: string, staffId: string, body: Partial<CafeStaff>) =>
    api.patch(`/cafes/${cafeId}/staff/${staffId}`, body) as unknown as Promise<{ data: CafeStaff }>,
  removeStaff: (cafeId: string, staffId: string) => api.delete(`/cafes/${cafeId}/staff/${staffId}`),

  // ops
  orders: (
    cafeId: string,
    params: { status?: string; scope?: 'active' | 'today' | 'all'; page?: number; pageSize?: number } = {},
  ) =>
    api.get(`/cafes/${cafeId}/orders`, { params }) as unknown as Promise<
      Paginated<Order> & { kitchenLoad: KitchenLoad }
    >,

  presence: (cafeId: string) =>
    getData<{ staff: PresenceEntry[]; onlineCount: number }>(`/cafes/${cafeId}/presence`),

  analyticsOverview: (cafeId: string) => getData<CafeAnalyticsOverview>(`/cafes/${cafeId}/analytics/overview`),
  analyticsTimeseries: (cafeId: string, days = 7) =>
    getData<{ date: string; revenue: number; orders: number }[]>(
      `/cafes/${cafeId}/analytics/timeseries`,
      { params: { days } },
    ),
  analyticsTopItems: (cafeId: string, limit = 10) =>
    getData<{ menuItemId: string; name: string; unitsSold: number; revenue: number }[]>(
      `/cafes/${cafeId}/analytics/top-items`,
      { params: { limit } },
    ),
  activity: (cafeId: string, page = 1) =>
    api.get(`/cafes/${cafeId}/activity`, { params: { page } }) as unknown as Promise<Paginated<ActivityLog>>,
};

export interface CafeAnalyticsOverview {
  todayRevenue: number;
  todayOrders: number;
  lifetimeRevenue: number;
  lifetimeOrders: number;
  totalCustomers: number;
  statusCounts: Record<string, number>;
  activeOrders: number;
  avgPrepMinutes: number | null;
  kitchenLoad: KitchenLoad;
  staffOnline: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; name: string; role: string } | null;
  cafe?: { id: string; name: string } | null;
}
