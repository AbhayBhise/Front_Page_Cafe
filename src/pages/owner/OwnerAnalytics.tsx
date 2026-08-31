import { useCallback, useEffect, useState } from 'react';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { cafeService, type CafeAnalyticsOverview } from '../../services/cafeService';
import { PageState, StatCard, OrderStatusBadge } from '../../components/ui';
import BarChart from '../../components/BarChart';
import { money, dateShort } from '../../lib/format';

const OwnerAnalytics = () => {
  const { cafeId } = useOwnerCafe();
  const [overview, setOverview] = useState<CafeAnalyticsOverview | null>(null);
  const [series, setSeries] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; unitsSold: number; revenue: number }[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      cafeService.analyticsOverview(cafeId),
      cafeService.analyticsTimeseries(cafeId, days),
      cafeService.analyticsTopItems(cafeId, 8),
    ])
      .then(([o, s, t]) => {
        setOverview(o);
        setSeries(s);
        setTopItems(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [cafeId, days]);

  useEffect(load, [load]);

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold m-0">Analytics</h2>
        <div className="btn-group btn-group-sm">
          {[7, 14, 30].map((d) => (
            <button key={d} className={`btn ${days === d ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <PageState loading={loading} error={error} onRetry={load}>
        {overview && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <StatCard label="Today" value={money(overview.todayRevenue)} icon="calendar-day" hint={`${overview.todayOrders} orders`} />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Lifetime revenue" value={money(overview.lifetimeRevenue)} icon="cash-stack" />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Lifetime orders" value={overview.lifetimeOrders} icon="receipt" />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard label="Avg prep time" value={overview.avgPrepMinutes ? `${overview.avgPrepMinutes} min` : '—'} icon="stopwatch" />
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Revenue · last {days} days</h6>
                    <BarChart data={series.map((s) => ({ label: dateShort(s.date), value: s.revenue }))} format="money" />
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Order status mix</h6>
                    {Object.entries(overview.statusCounts).map(([status, count]) => (
                      <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                        <OrderStatusBadge status={status} />
                        <span className="fw-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Best sellers</h6>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Item</th>
                            <th className="text-end">Units sold</th>
                            <th className="text-end">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topItems.map((t) => (
                            <tr key={t.name}>
                              <td>{t.name}</td>
                              <td className="text-end">{t.unitsSold}</td>
                              <td className="text-end">{money(t.revenue)}</td>
                            </tr>
                          ))}
                          {topItems.length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-center text-muted py-3">
                                No sales yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </PageState>
    </div>
  );
};

export default OwnerAnalytics;
