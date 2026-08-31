import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCafeQueue } from '../../hooks/useCafeQueue';
import { useHeartbeat } from '../../hooks/useSocketEvent';
import OrderQueueCard from '../../components/OrderQueueCard';
import { PageState, StatCard } from '../../components/ui';
import type { OrderStatus } from '../../types';

const COLUMNS: { title: string; statuses: OrderStatus[]; icon: string }[] = [
  { title: 'New', statuses: ['pending'], icon: 'bell' },
  { title: 'In kitchen', statuses: ['accepted', 'preparing'], icon: 'fire' },
  { title: 'Ready', statuses: ['ready'], icon: 'bag-check' },
];

const CounterConsole = () => {
  const { identity } = useAuth();
  const cafeId = identity?.cafe?.id ?? null;
  useHeartbeat(Boolean(cafeId));
  const { orders, kitchenLoad, loading, error, reload, transition } = useCafeQueue(cafeId, 'active');

  const grouped = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        orders: orders.filter((o) => col.statuses.includes(o.status)),
      })),
    [orders],
  );

  if (!identity?.cafe) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted">Your account isn't linked to a cafe. Ask your manager to assign you.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4" style={{ minHeight: '80vh' }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h2 className="fw-bold m-0">
            <i className="bi bi-display me-2 text-primary" /> Counter Console
          </h2>
          <span className="text-muted small">
            {identity.cafe.name}
            {identity.staff?.counterName ? ` · ${identity.staff.counterName}` : ''}
          </span>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={reload}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard label="Waiting" value={grouped[0].orders.length} icon="bell" tone="bg-primary text-white" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="In kitchen" value={grouped[1].orders.length} icon="fire" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="Ready" value={grouped[2].orders.length} icon="bag-check" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="Backlog" value={`${kitchenLoad?.backlogMinutes ?? 0} min`} icon="stopwatch" />
        </div>
      </div>

      <PageState loading={loading} error={error} onRetry={reload}>
        <div className="row g-3">
          {grouped.map((col) => (
            <div className="col-lg-4" key={col.title}>
              <h6 className="fw-bold text-muted mb-2">
                <i className={`bi bi-${col.icon} me-1`} />
                {col.title} ({col.orders.length})
              </h6>
              <div className="d-flex flex-column gap-3">
                {col.orders.length === 0 ? (
                  <div className="text-muted small border rounded-4 p-3 text-center bg-light">Nothing here</div>
                ) : (
                  col.orders.map((o) => (
                    <OrderQueueCard key={o.id} order={o} onTransition={(s, note) => transition(o.id, s, note)} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
};

export default CounterConsole;
