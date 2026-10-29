import { api, getData } from '../lib/api';
import type { FulfillmentType, Order, OrderStatus, Paginated, PaymentMethod } from '../types';
import {
  isStaticPreview,
  isOfflineError,
  mockPlaceOrder,
  getStoredOrders,
  mockTransitionOrder,
} from './mockStorage';

export interface PlaceOrderPayload {
  cafeId?: string;
  items: { menuItemId: string; quantity: number }[];
  fulfillmentType: FulfillmentType;
  tableNumber?: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  payment: { method: PaymentMethod; token?: string };
}

export const orderService = {
  place: async (payload: PlaceOrderPayload): Promise<{ data: Order }> => {
    if (isStaticPreview()) {
      return { data: mockPlaceOrder(payload) };
    }
    try {
      return (await api.post('/orders', payload)) as unknown as { data: Order };
    } catch (error) {
      if (isOfflineError(error)) {
        return { data: mockPlaceOrder(payload) };
      }
      throw error;
    }
  },

  mine: async (params: { status?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<Order>> => {
    if (isStaticPreview()) {
      let orders = getStoredOrders();
      if (params.status) {
        orders = orders.filter((o) => o.status === params.status);
      }
      return {
        data: orders,
        meta: { page: 1, pageSize: 50, total: orders.length, pages: 1 },
      };
    }
    try {
      return (await api.get('/orders/mine', { params })) as unknown as Paginated<Order>;
    } catch (error) {
      if (isOfflineError(error)) {
        let orders = getStoredOrders();
        if (params.status) {
          orders = orders.filter((o) => o.status === params.status);
        }
        return {
          data: orders,
          meta: { page: 1, pageSize: 50, total: orders.length, pages: 1 },
        };
      }
      throw error;
    }
  },

  get: async (id: string): Promise<Order> => {
    if (isStaticPreview()) {
      const orders = getStoredOrders();
      const match = orders.find((o) => o.id === id);
      if (match) return match;
      throw new Error('Order not found');
    }
    try {
      return await getData<Order>(`/orders/${id}`);
    } catch (error) {
      if (isOfflineError(error)) {
        const orders = getStoredOrders();
        const match = orders.find((o) => o.id === id);
        if (match) return match;
      }
      throw error;
    }
  },

  transition: async (id: string, status: string, note?: string): Promise<{ data: Order }> => {
    if (isStaticPreview()) {
      return { data: mockTransitionOrder(id, status as OrderStatus, note) };
    }
    try {
      return (await api.post(`/orders/${id}/transition`, { status, note })) as unknown as { data: Order };
    } catch (error) {
      if (isOfflineError(error)) {
        return { data: mockTransitionOrder(id, status as OrderStatus, note) };
      }
      throw error;
    }
  },

  cancel: async (id: string, reason?: string): Promise<{ data: Order }> => {
    if (isStaticPreview()) {
      return { data: mockTransitionOrder(id, 'cancelled', reason) };
    }
    try {
      return (await api.post(`/orders/${id}/cancel`, { reason })) as unknown as { data: Order };
    } catch (error) {
      if (isOfflineError(error)) {
        return { data: mockTransitionOrder(id, 'cancelled', reason) };
      }
      throw error;
    }
  },
};
