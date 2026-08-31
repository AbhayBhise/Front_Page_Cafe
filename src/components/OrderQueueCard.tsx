import { useState } from 'react';
import { OrderStatusBadge } from './ui';
import { money, timeAgo } from '../lib/format';
import type { Order, OrderStatus } from '../types';

const NEXT_ACTIONS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; variant: string }[]>> = {
  pending: [
    { to: 'accepted', label: 'Accept', variant: 'success' },
    { to: 'rejected', label: 'Reject', variant: 'outline-danger' },
  ],
  accepted: [{ to: 'preparing', label: 'Start preparing', variant: 'primary' }],
  preparing: [{ to: 'ready', label: 'Mark ready', variant: 'success' }],
  ready: [{ to: 'completed', label: 'Handed over', variant: 'secondary' }],
};

const OrderQueueCard = ({
  order,
  onTransition,
}: {
  order: Order;
  onTransition: (status: OrderStatus, note?: string) => Promise<void> | void;
}) => {
  const [busy, setBusy] = useState<string | null>(null);
  const actions = NEXT_ACTIONS[order.status] ?? [];

  const run = async (to: OrderStatus) => {
    let note: string | undefined;
    if (to === 'rejected') {
      note = window.prompt('Reason for rejecting this order?') || undefined;
      if (note === undefined) return;
    }
    setBusy(to);
    try {
      await onTransition(to, note);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="fw-bold mb-0">
              #{order.orderNumber}
              <span className="badge bg-light text-dark ms-2">
                {order.fulfillmentType === 'dine_in' ? `Table ${order.tableNumber ?? '—'}` : 'Takeaway'}
              </span>
            </h6>
            <span className="text-muted small">
              {order.customer?.name ?? order.customerName ?? 'Guest'} · {timeAgo(order.placedAt)}
            </span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <ul className="list-unstyled small mb-2">
          {order.items.map((it) => (
            <li key={it.id}>
              <span className="fw-semibold">{it.quantity}×</span> {it.nameSnapshot}
            </li>
          ))}
        </ul>
        {order.notes && <p className="small fst-italic text-muted mb-2">“{order.notes}”</p>}

        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">{money(order.total, order.cafe?.currency)}</span>
          <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
            {order.paymentMethod} · {order.paymentStatus}
          </span>
        </div>

        {actions.length > 0 && (
          <div className="d-flex gap-2 mt-3">
            {actions.map((a) => (
              <button
                key={a.to}
                className={`btn btn-sm btn-${a.variant} flex-fill`}
                disabled={busy !== null}
                onClick={() => run(a.to)}
              >
                {busy === a.to ? '…' : a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderQueueCard;
