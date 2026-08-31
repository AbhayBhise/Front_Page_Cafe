import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { PageState, OrderStatusBadge } from '../components/ui';
import { money, dateTime } from '../lib/format';
import BackButton from '../components/BackButton';
import type { Order } from '../types';

const FILTERS = ['all', 'active', 'completed'] as const;
type Filter = (typeof FILTERS)[number];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    orderService
      .mine({ pageSize: 50 })
      .then((res) => setOrders(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useSocketEvent<Order>('order:updated', (updated) => {
    setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  });

  const activeStatuses = ['pending', 'accepted', 'preparing', 'ready'];
  const visible = orders.filter((o) => {
    if (filter === 'active') return activeStatuses.includes(o.status);
    if (filter === 'completed') return !activeStatuses.includes(o.status);
    return true;
  });

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <BackButton fallbackPath="/" />
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="fw-bold m-0">My orders</h2>
        <div className="btn-group btn-group-sm">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`btn text-capitalize ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <PageState
        loading={loading}
        error={error}
        empty={visible.length === 0}
        emptyIcon="receipt"
        emptyTitle="No orders here"
        emptyHint={<Link to="/cafes">Browse cafes to place your first order</Link>}
        onRetry={load}
      >
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {visible.map((o) => (
            <div className="col" key={o.id}>
              <Link to={`/orders/${o.id}`} className="text-decoration-none text-reset">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-0">Order #{o.orderNumber}</h6>
                        <span className="text-muted small">{o.cafe?.name}</span>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="small text-muted mb-1">
                      <i className="bi bi-clock me-1" />
                      {dateTime(o.placedAt)}
                    </p>
                    <p className="small mb-2">{o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-primary">{money(o.total, o.cafe?.currency)}</span>
                      {activeStatuses.includes(o.status) && o.queuePosition ? (
                        <span className="badge bg-info text-dark">Queue #{o.queuePosition}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
};

export default Orders;
