import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { useCafeQueue } from '../../hooks/useCafeQueue';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { cafeService, type CafeAnalyticsOverview } from '../../services/cafeService';
import OrderQueueCard from '../../components/OrderQueueCard';
import CafeStatusBanner from '../../components/CafeStatusBanner';
import { PageState, StatCard, Spinner } from '../../components/ui';
import { money, timeAgo } from '../../lib/format';
import type { PresenceEntry } from '../../types';

const OwnerDashboard = () => {
  const { cafe, cafeId, loading, error, reload, setCafe } = useOwnerCafe();
  const queue = useCafeQueue(cafeId, 'active');
  const [overview, setOverview] = useState<CafeAnalyticsOverview | null>(null);
  const [presence, setPresence] = useState<PresenceEntry[]>([]);

  const loadSecondary = useCallback(() => {
    if (!cafeId) return;
    cafeService.analyticsOverview(cafeId).then(setOverview).catch(() => undefined);
    cafeService.presence(cafeId).then((p) => setPresence(p.staff)).catch(() => undefined);
  }, [cafeId]);

  useEffect(loadSecondary, [loadSecondary]);

  useSocketEvent<{ cafeId: string; staff: PresenceEntry[] }>('presence:update', (p) => {
    if (p.cafeId === cafeId) setPresence(p.staff);
  });
  useSocketEvent('order:new', loadSecondary);
  useSocketEvent('order:updated', loadSecondary);

  const toggleOpen = async () => {
    if (!cafe) return;
    try {
      const res = await cafeService.toggleOpen(cafe.id, !cafe.isOpen);
      setCafe({ ...cafe, isOpen: res.data.isOpen });
      toast.success(res.data.isOpen ? 'Cafe is now open' : 'Cafe is now closed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update');
    }
  };

  if (loading) return <Spinner label="Loading your cafe…" />;
  if (error || !cafe)
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted">{error || 'No cafe found for this account.'}</p>
        <button className="btn btn-outline-secondary btn-sm" onClick={reload}>
          Retry
        </button>
      </div>
    );

  const load = overview?.kitchenLoad;

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="fw-bold m-0">
          <i className="bi bi-shop me-2 text-primary" />
          {cafe.name}
        </h2>
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="openSwitch"
              checked={cafe.isOpen}
              disabled={cafe.status !== 'approved'}
              onChange={toggleOpen}
            />
            <label className="form-check-label fw-semibold" htmlFor="openSwitch">
              {cafe.isOpen ? 'Open' : 'Closed'}
            </label>
          </div>
          <Link to="/owner/menu" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-card-list me-1" /> Manage menu
          </Link>
        </div>
      </div>

      <CafeStatusBanner cafe={cafe} />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Today's revenue" value={money(overview?.todayRevenue)} icon="cash-stack" tone="bg-primary text-white" hint={`${overview?.todayOrders ?? 0} orders`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Active orders" value={overview?.activeOrders ?? queue.orders.length} icon="hourglass-split" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Kitchen backlog"
            value={`${load?.backlogMinutes ?? 0} min`}
            icon="fire"
            hint={`${load?.activeOrders ?? 0} in the kitchen`}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Staff online" value={presence.filter((p) => p.online).length} icon="broadcast" hint="live now" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold m-0">Live queue</h5>
            <button className="btn btn-sm btn-link text-decoration-none" onClick={queue.reload}>
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </div>
          <PageState
            loading={queue.loading}
            error={queue.error}
            empty={queue.orders.length === 0}
            emptyIcon="cup-hot"
            emptyTitle="No live orders"
            emptyHint="New orders appear here instantly."
            onRetry={queue.reload}
          >
            <div className="row row-cols-1 row-cols-md-2 g-3">
              {queue.orders.map((o) => (
                <div className="col" key={o.id}>
                  <OrderQueueCard order={o} onTransition={(s, note) => queue.transition(o.id, s, note)} />
                </div>
              ))}
            </div>
          </PageState>
        </div>

        <div className="col-lg-4">
          <h5 className="fw-bold mb-2">Counter presence</h5>
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              {presence.length === 0 ? (
                <p className="text-muted small mb-0">No staff have signed in yet.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {presence.map((p) => (
                    <li key={p.userId} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <span>
                        <i
                          className={`bi bi-circle-fill me-2 ${p.online ? 'text-success' : 'text-secondary'}`}
                          style={{ fontSize: 9 }}
                        />
                        {p.name}
                        <span className="text-muted small ms-1">
                          · {p.role === 'owner' ? 'Owner' : p.counterName || 'Counter'}
                        </span>
                      </span>
                      <span className="text-muted small">{p.online ? 'online' : timeAgo(p.lastSeenAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/owner/staff" className="btn btn-outline-secondary btn-sm w-100 mt-3">
                Manage staff & counters
              </Link>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mt-3">
            <div className="card-body">
              <h6 className="fw-bold">Lifetime</h6>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Revenue</span>
                <span>{money(overview?.lifetimeRevenue)}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Orders</span>
                <span>{overview?.lifetimeOrders ?? 0}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Customers</span>
                <span>{overview?.totalCustomers ?? 0}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Avg prep time</span>
                <span>{overview?.avgPrepMinutes ? `${overview.avgPrepMinutes} min` : '—'}</span>
              </div>
              <Link to="/owner/analytics" className="btn btn-outline-primary btn-sm w-100 mt-2">
                Full analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
