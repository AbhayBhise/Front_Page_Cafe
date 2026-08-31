import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cafeService } from '../services/cafeService';
import { orderService } from '../services/orderService';
import { useSocketEvent } from './useSocketEvent';
import type { KitchenLoad, Order, OrderStatus } from '../types';

export function useCafeQueue(cafeId: string | null, scope: 'active' | 'today' = 'active') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenLoad, setKitchenLoad] = useState<KitchenLoad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    cafeService
      .orders(cafeId, { scope, pageSize: 100 })
      .then((res) => {
        setOrders(res.data);
        setKitchenLoad(res.kitchenLoad);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [cafeId, scope]);

  useEffect(load, [load]);

  const upsert = useCallback(
    (order: Order) => {
      setOrders((list) => {
        const active = ['pending', 'accepted', 'preparing', 'ready'];
        const exists = list.some((o) => o.id === order.id);
        let next = exists ? list.map((o) => (o.id === order.id ? { ...o, ...order } : o)) : [...list, order];
        if (scope === 'active') next = next.filter((o) => active.includes(o.status));
        return next.sort((a, b) => +new Date(a.placedAt) - +new Date(b.placedAt));
      });
    },
    [scope],
  );

  useSocketEvent<Order>('order:new', (o) => {
    if (o.cafeId === cafeId) {
      upsert(o);
      toast(`New order #${o.orderNumber}`, { icon: '🔔' });
    }
  });
  useSocketEvent<Order>('order:updated', (o) => {
    if (o.cafeId === cafeId) upsert(o);
  });

  const transition = useCallback(
    async (id: string, status: OrderStatus, note?: string) => {
      try {
        const res = await orderService.transition(id, status, note);
        upsert(res.data);
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update order');
      }
    },
    [upsert, load],
  );

  return { orders, kitchenLoad, loading, error, reload: load, transition };
}
