import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { PageState, OrderStatusBadge } from '../components/ui';
import { money, dateTime } from '../lib/format';
import BackButton from '../components/BackButton';
import type { Order } from '../types';

const STEPS: { key: Order['status']; label: string; icon: string }[] = [
  { key: 'pending', label: 'Placed', icon: 'bag-plus' },
  { key: 'accepted', label: 'Accepted', icon: 'check2-circle' },
  { key: 'preparing', label: 'Preparing', icon: 'fire' },
  { key: 'ready', label: 'Ready', icon: 'bag-check' },
  { key: 'completed', label: 'Picked up', icon: 'check-all' },
];

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    orderService
      .get(id)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  useSocketEvent<Order>('order:updated', (updated) => {
    if (updated.id === id) {
      setOrder((prev) => ({ ...(prev as Order), ...updated }));
      toast(`Order is now ${updated.status}`, { icon: 'ℹ️' });
    }
  });

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await orderService.cancel(order.id);
      setOrder(res.data);
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  const terminal = order && ['completed', 'cancelled', 'rejected'].includes(order.status);
  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const isActive = order && ['pending', 'accepted', 'preparing', 'ready'].includes(order.status);

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <BackButton fallbackPath="/orders" />
      <PageState loading={loading} error={error} onRetry={load}>
        {order && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="fw-bold mb-0">Order #{order.orderNumber}</h4>
                      <span className="text-muted">
                        {order.cafe?.name} · {order.fulfillmentType === 'dine_in' ? `Dine-in (table ${order.tableNumber ?? '—'})` : 'Takeaway'}
                      </span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {isActive && (
                    <div className="alert alert-primary d-flex align-items-center justify-content-between mb-4">
                      <div>
                        <div className="fw-bold">
                          <i className="bi bi-stopwatch me-1" />
                          {order.status === 'ready'
                            ? 'Ready for pickup!'
                            : `Estimated ready in ~${order.etaMinutes ?? '—'} min`}
                        </div>
                        <small className="text-muted">Kitchen-load-aware estimate, updates live</small>
                      </div>
                      {order.queuePosition ? (
                        <div className="text-center">
                          <div className="fs-3 fw-bold">#{order.queuePosition}</div>
                          <small className="text-muted">in queue</small>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* progress tracker */}
                  {order.status !== 'cancelled' && order.status !== 'rejected' && (
                    <div className="d-flex justify-content-between mb-4 position-relative">
                      {STEPS.map((s, i) => {
                        const done = i <= stepIndex;
                        return (
                          <div key={s.key} className="text-center flex-fill">
                            <div
                              className={`mx-auto d-flex align-items-center justify-content-center rounded-circle ${
                                done ? 'bg-primary text-white' : 'bg-light text-muted'
                              }`}
                              style={{ width: 40, height: 40 }}
                            >
                              <i className={`bi bi-${s.icon}`} />
                            </div>
                            <small className={done ? 'fw-semibold' : 'text-muted'}>{s.label}</small>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(order.status === 'cancelled' || order.status === 'rejected') && order.cancelReason && (
                    <div className="alert alert-danger">{order.cancelReason}</div>
                  )}

                  <h6 className="fw-bold mb-2">Items</h6>
                  <ul className="list-group list-group-flush border rounded-3 mb-3">
                    {order.items.map((it) => (
                      <li key={it.id} className="list-group-item d-flex justify-content-between">
                        <span>
                          {it.quantity} × {it.nameSnapshot}
                        </span>
                        <span>{money(it.lineTotal, order.cafe?.currency)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Subtotal</span>
                    <span>{money(order.subtotal, order.cafe?.currency)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Tax</span>
                    <span>{money(order.taxAmount, order.cafe?.currency)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5 mt-1">
                    <span>Total</span>
                    <span className="text-primary">{money(order.total, order.cafe?.currency)}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    Payment: {order.paymentMethod ?? '—'} · {order.paymentStatus}
                  </div>

                  {order.status === 'pending' && (
                    <button className="btn btn-outline-danger w-100 mt-3" disabled={cancelling} onClick={cancel}>
                      {cancelling ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  )}
                  {terminal && (
                    <a href="/cafes" className="btn btn-outline-primary w-100 mt-3">
                      Order again
                    </a>
                  )}
                </div>
              </div>

              {order.events && order.events.length > 0 && (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">Timeline</h6>
                    <ul className="list-unstyled mb-0">
                      {order.events.map((ev) => (
                        <li key={ev.id} className="d-flex gap-3 mb-3">
                          <i className="bi bi-circle-fill text-primary" style={{ fontSize: 8, marginTop: 6 }} />
                          <div>
                            <div className="fw-semibold text-capitalize">{ev.status}</div>
                            {ev.note && <div className="text-muted small">{ev.note}</div>}
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {dateTime(ev.createdAt)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
};

export default OrderDetails;
