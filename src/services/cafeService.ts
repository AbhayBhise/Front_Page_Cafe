import { api, getData } from '../lib/api';
import { FALLBACK_CAFES } from '../data/fallbackData';
import {
  isStaticPreview,
  isOfflineError,
  getAllCafesMerged,
  getCafeByIdOrSlug,
  getCustomCafes,
  getStoredOrders,
} from './mockStorage';
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
    if (isStaticPreview()) {
      return getAllCafesMerged(params);
    }
    try {
      const res = await (api.get('/cafes', { params }) as unknown as Promise<Paginated<Cafe>>);
      if (res && res.data && res.data.length > 0) return res;
      return getAllCafesMerged(params);
    } catch {
      return getAllCafesMerged(params);
    }
  },

  get: async (idOrSlug: string) => {
    if (isStaticPreview()) {
      return getCafeByIdOrSlug(idOrSlug);
    }
    try {
      return await getData<Cafe>(`/cafes/${idOrSlug}`);
    } catch {
      return getCafeByIdOrSlug(idOrSlug);
    }
  },

  mine: async () => {
    if (isStaticPreview()) {
      const raw = localStorage.getItem('fpc.identity');
      const identity = raw ? JSON.parse(raw) : null;
      const cafe = identity?.cafe || getCustomCafes()[0] || FALLBACK_CAFES[0];
      return {
        ...cafe,
        counters: [
          { id: 'cnt-1', cafeId: cafe.id, name: 'Main Espresso Bar', code: 'MAIN', isActive: true },
          { id: 'cnt-2', cafeId: cafe.id, name: 'Kitchen Dispatch', code: 'KITCHEN', isActive: true },
        ],
      } as Cafe & { counters: Counter[] };
    }
    try {
      return await getData<Cafe & { counters: Counter[] }>('/cafes/mine');
    } catch (error) {
      if (isOfflineError(error)) {
        const raw = localStorage.getItem('fpc.identity');
        const identity = raw ? JSON.parse(raw) : null;
        const cafe = identity?.cafe || getCustomCafes()[0] || FALLBACK_CAFES[0];
        return {
          ...cafe,
          counters: [
            { id: 'cnt-1', cafeId: cafe.id, name: 'Main Espresso Bar', code: 'MAIN', isActive: true },
          ],
        } as Cafe & { counters: Counter[] };
      }
      throw error;
    }
  },

  patchCafe: async (cafeId: string, patch: Record<string, unknown>) => {
    try {
      return (await api.patch(`/cafes/${cafeId}`, patch)) as unknown as { data: Cafe };
    } catch (error) {
      if (isOfflineError(error)) {
        const cafe = getCafeByIdOrSlug(cafeId);
        const updated = { ...cafe, ...patch };
        return { data: updated };
      }
      throw error;
    }
  },

  toggleOpen: async (cafeId: string, isOpen: boolean) => {
    try {
      return (await api.post(`/cafes/${cafeId}/toggle-open`, { isOpen })) as unknown as { data: Cafe };
    } catch (error) {
      if (isOfflineError(error)) {
        const cafe = getCafeByIdOrSlug(cafeId);
        const updated = { ...cafe, isOpen };
        return { data: updated };
      }
      throw error;
    }
  },

  // counters
  listCounters: async (cafeId: string) => {
    try {
      return await getData<Counter[]>(`/cafes/${cafeId}/counters`);
    } catch {
      return [
        { id: 'cnt-1', cafeId, name: 'Main Espresso Bar', code: 'MAIN', isActive: true },
        { id: 'cnt-2', cafeId, name: 'Kitchen Counter', code: 'KITCHEN', isActive: true },
      ];
    }
  },
  createCounter: (cafeId: string, body: { name: string; code: string; isActive?: boolean }) =>
    api.post(`/cafes/${cafeId}/counters`, body) as unknown as Promise<{ data: Counter }>,
  updateCounter: (cafeId: string, counterId: string, body: Partial<Counter>) =>
    api.patch(`/cafes/${cafeId}/counters/${counterId}`, body) as unknown as Promise<{ data: Counter }>,
  deleteCounter: (cafeId: string, counterId: string) => api.delete(`/cafes/${cafeId}/counters/${counterId}`),

  // tables (QR)
  listTables: async (cafeId: string): Promise<CafeTable[]> => {
    try {
      return await getData<CafeTable[]>(`/cafes/${cafeId}/tables`);
    } catch {
      return [
        { id: 'tbl-1', label: 'Table 1', code: 'T1', qrUrl: '/qr/table-1', isActive: true, createdAt: new Date().toISOString() },
        { id: 'tbl-2', label: 'Table 2', code: 'T2', qrUrl: '/qr/table-2', isActive: true, createdAt: new Date().toISOString() },
        { id: 'tbl-3', label: 'Table 3', code: 'T3', qrUrl: '/qr/table-3', isActive: true, createdAt: new Date().toISOString() },
      ];
    }
  },
  createTable: (cafeId: string, body: { label: string; code?: string }) =>
    api.post(`/cafes/${cafeId}/tables`, body) as unknown as Promise<{ data: CafeTable }>,
  updateTable: (cafeId: string, tableId: string, body: { label?: string; isActive?: boolean }) =>
    api.patch(`/cafes/${cafeId}/tables/${tableId}`, body) as unknown as Promise<{ data: CafeTable }>,
  rotateTable: (cafeId: string, tableId: string) =>
    api.post(`/cafes/${cafeId}/tables/${tableId}/rotate`, {}) as unknown as Promise<{ data: CafeTable }>,
  deleteTable: (cafeId: string, tableId: string) => api.delete(`/cafes/${cafeId}/tables/${tableId}`),

  // staff
  listStaff: async (cafeId: string) => {
    try {
      return await getData<CafeStaff[]>(`/cafes/${cafeId}/staff`);
    } catch {
      return [
        { id: 'st-1', cafeId, userId: 'usr-1', title: 'Head Barista', isActive: true },
        { id: 'st-2', cafeId, userId: 'usr-2', title: 'Pizza Chef', isActive: true },
      ];
    }
  },
  createStaff: (
    cafeId: string,
    body: { name: string; email: string; password: string; title?: string; counterId?: string | null },
  ) => api.post(`/cafes/${cafeId}/staff`, body) as unknown as Promise<{ data: CafeStaff }>,
  updateStaff: (cafeId: string, staffId: string, body: Partial<CafeStaff>) =>
    api.patch(`/cafes/${cafeId}/staff/${staffId}`, body) as unknown as Promise<{ data: CafeStaff }>,
  removeStaff: (cafeId: string, staffId: string) => api.delete(`/cafes/${cafeId}/staff/${staffId}`),

  // ops
  orders: async (
    cafeId: string,
    params: { status?: string; scope?: 'active' | 'today' | 'all'; page?: number; pageSize?: number } = {},
  ) => {
    if (isStaticPreview()) {
      const stored = getStoredOrders().filter((o) => o.cafeId === cafeId || !params.status);
      return {
        data: stored,
        meta: { page: 1, pageSize: 50, total: stored.length, pages: 1 },
        kitchenLoad: { activeOrders: stored.length, backlogMinutes: stored.length * 5, queue: stored.map((o) => o.id) },
      };
    }
    try {
      return (await api.get(`/cafes/${cafeId}/orders`, { params })) as unknown as Paginated<Order> & {
        kitchenLoad: KitchenLoad;
      };
    } catch {
      const stored = getStoredOrders().filter((o) => o.cafeId === cafeId || !params.status);
      return {
        data: stored,
        meta: { page: 1, pageSize: 50, total: stored.length, pages: 1 },
        kitchenLoad: { activeOrders: stored.length, backlogMinutes: stored.length * 5, queue: stored.map((o) => o.id) },
      };
    }
  },

  presence: async (cafeId: string): Promise<{ staff: PresenceEntry[]; onlineCount: number }> => {
    try {
      return await getData<{ staff: PresenceEntry[]; onlineCount: number }>(`/cafes/${cafeId}/presence`);
    } catch {
      return {
        staff: [
          {
            userId: 'usr-1',
            name: 'Barista Alex',
            role: 'counter',
            counterId: 'cnt-1',
            counterName: 'Main Espresso Bar',
            online: true,
            connectedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
          {
            userId: 'usr-2',
            name: 'Cafe Manager',
            role: 'owner',
            counterId: null,
            counterName: null,
            online: true,
            connectedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
        ],
        onlineCount: 2,
      };
    }
  },

  analyticsOverview: async (cafeId: string) => {
    try {
      return await getData<CafeAnalyticsOverview>(`/cafes/${cafeId}/analytics/overview`);
    } catch {
      const orders = getStoredOrders();
      return {
        todayRevenue: 4820,
        todayOrders: Math.max(12, orders.length),
        lifetimeRevenue: 84500,
        lifetimeOrders: 215,
        totalCustomers: 184,
        statusCounts: { pending: 1, accepted: 2, preparing: 1, ready: 1, completed: 18 },
        activeOrders: 4,
        avgPrepMinutes: 11,
        kitchenLoad: { activeOrders: 4, backlogMinutes: 14, queue: ['1', '2', '3', '4'] },
        staffOnline: 2,
      };
    }
  },

  analyticsTimeseries: async (cafeId: string, days = 7) => {
    try {
      return await getData<{ date: string; revenue: number; orders: number }[]>(
        `/cafes/${cafeId}/analytics/timeseries`,
        { params: { days } },
      );
    } catch {
      const today = new Date();
      return Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.floor(3000 + Math.random() * 4000),
          orders: Math.floor(15 + Math.random() * 20),
        };
      });
    }
  },

  analyticsTopItems: async (cafeId: string, limit = 10) => {
    try {
      return await getData<{ menuItemId: string; name: string; unitsSold: number; revenue: number }[]>(
        `/cafes/${cafeId}/analytics/top-items`,
        { params: { limit } },
      );
    } catch {
      return [
        { menuItemId: 'item-1', name: 'Specialty Ethiopian Pour-Over', unitsSold: 42, revenue: 10080 },
        { menuItemId: 'item-2', name: 'Wood-Fired Margherita Pizza', unitsSold: 38, revenue: 14440 },
        { menuItemId: 'item-3', name: 'Velvet Flat White', unitsSold: 34, revenue: 7140 },
        { menuItemId: 'item-4', name: 'French Butter Croissant', unitsSold: 28, revenue: 4200 },
      ].slice(0, limit);
    }
  },

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
