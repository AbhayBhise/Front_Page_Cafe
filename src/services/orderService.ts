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
      // If direct link visited without placing order locally, generate mock order
      return {
        id,
        orderNumber: 1042,
        cafeId: 'cafe-front-page',
        customerId: 'usr-guest',
        status: 'preparing',
        fulfillmentType: 'dine_in',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        subtotal: 580,
        taxAmount: 29,
        discountAmount: 0,
        total: 609,
        tableNumber: '4',
        customerName: 'Guest Diner',
        placedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        acceptedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        etaMinutes: 8,
        queuePosition: 2,
        items: [
          {
            id: 'oi-1',
            menuItemId: 'item-1',
            nameSnapshot: 'Specialty Ethiopian Pour-Over',
            priceSnapshot: 240,
            quantity: 1,
            lineTotal: 240,
          },
          {
            id: 'oi-2',
            menuItemId: 'item-2',
            nameSnapshot: 'Wood-Fired Margherita Pizza',
            priceSnapshot: 340,
            quantity: 1,
            lineTotal: 340,
          },
        ],
        events: [
          { id: 'ev-1', status: 'pending', note: 'Order placed by guest', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: 'ev-2', status: 'accepted', note: 'Kitchen confirmed ticket', createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
          { id: 'ev-3', status: 'preparing', note: 'Barista grinding and brewing', createdAt: new Date().toISOString() },
        ],
        cafe: { id: 'cafe-front-page', name: 'Front Page Cafe', slug: 'front-page-cafe', currency: 'INR' },
      };
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
