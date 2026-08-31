import { api, getData } from '../lib/api';
import type { FulfillmentType, Order, Paginated, PaymentMethod } from '../types';

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
  place: (payload: PlaceOrderPayload) =>
    api.post('/orders', payload) as unknown as Promise<{ data: Order }>,

  mine: (params: { status?: string; page?: number; pageSize?: number } = {}) =>
    api.get('/orders/mine', { params }) as unknown as Promise<Paginated<Order>>,

  get: (id: string) => getData<Order>(`/orders/${id}`),

  transition: (id: string, status: string, note?: string) =>
    api.post(`/orders/${id}/transition`, { status, note }) as unknown as Promise<{ data: Order }>,

  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }) as unknown as Promise<{ data: Order }>,
};
