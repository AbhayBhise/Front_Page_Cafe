import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  adminService,
  type AdminCafe,
  type AdminUser,
  type PlatformOverview,
} from '../../services/adminService';
import type { ActivityLog } from '../../services/cafeService';
import { PageState, StatCard, CafeStatusBadge } from '../../components/ui';
import BarChart from '../../components/BarChart';
import ActivityFeed from '../../components/ActivityFeed';
import { money, dateShort, dateTime } from '../../lib/format';

type Tab = 'overview' | 'approvals' | 'users' | 'activity';

const AdminDashboard = () => {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="container py-4" style={{ minHeight: '75vh' }}>
      <h2 className="fw-bold mb-3">
        <i className="bi bi-shield-lock me-2 text-danger" /> Admin control center
      </h2>
      <ul className="nav nav-pills mb-4 gap-2">
        {(['overview', 'approvals', 'users', 'activity'] as Tab[]).map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link text-capitalize ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'overview' && <Overview />}
      {tab === 'approvals' && <Approvals />}
      {tab === 'users' && <Users />}
      {tab === 'activity' && <Activity />}
    </div>
  );
};

const Overview = () => {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [series, setSeries] = useState<{ date: string; gmv: number; orders: number; signups: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([adminService.overview(), adminService.timeseries(14)])
      .then(([o, s]) => {
        setData(o);
        setSeries(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  return (
    <PageState loading={loading} error={error} onRetry={load}>
      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard label="Platform GMV" value={money(data.gmv)} icon="cash-stack" tone="bg-primary text-white" hint={`${money(data.todayGmv)} today`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Total orders" value={data.totalOrders} icon="receipt" hint={`${data.todayOrders} today`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Registered users" value={data.totalUsers} icon="people" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Live cafes" value={data.liveCafes} icon="shop" hint={`${data.pendingApprovals} pending`} />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">GMV · last 14 days</h6>
                  <BarChart data={series.map((s) => ({ label: dateShort(s.date), value: s.gmv }))} format="money" />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Breakdown</h6>
                  <p className="small text-muted mb-1">Users by role</p>
                  {Object.entries(data.users).map(([role, n]) => (
                    <div key={role} className="d-flex justify-content-between small">
                      <span className="text-capitalize">{role}</span>
                      <span className="fw-semibold">{n}</span>
                    </div>
                  ))}
                  <hr />
                  <p className="small text-muted mb-1">Cafes by status</p>
                  {Object.entries(data.cafes).map(([status, n]) => (
                    <div key={status} className="d-flex justify-content-between small">
                      <CafeStatusBadge status={status} />
                      <span className="fw-semibold">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageState>
  );
};

const Approvals = () => {
  const [cafes, setCafes] = useState<AdminCafe[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService
      .cafes(filter || undefined)
      .then(setCafes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);
  useEffect(load, [load]);

  const review = async (cafe: AdminCafe, decision: 'approve' | 'reject' | 'suspend') => {
    let reason: string | undefined;
    if (decision !== 'approve') {
      reason = window.prompt(`Reason to ${decision} "${cafe.name}"?`) || undefined;
      if (!reason) return;
    }
    try {
      await adminService.reviewCafe(cafe.id, decision, reason);
      toast.success(`${cafe.name} ${decision}d`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    }
  };

  return (
    <>
      <div className="btn-group btn-group-sm mb-3">
        {['pending', 'approved', 'rejected', 'suspended', ''].map((s) => (
          <button key={s || 'all'} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline-primary'} text-capitalize`} onClick={() => setFilter(s)}>
            {s || 'all'}
          </button>
        ))}
      </div>
      <PageState loading={loading} error={error} empty={cafes.length === 0} emptyIcon="shop" emptyTitle="No cafes in this bucket" onRetry={load}>
        <div className="row row-cols-1 row-cols-lg-2 g-3">
          {cafes.map((cafe) => (
            <div className="col" key={cafe.id}>
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="fw-bold mb-0">{cafe.name}</h6>
                      <span className="text-muted small">
                        {[cafe.city, cafe.state].filter(Boolean).join(', ') || 'No location'}
                      </span>
                    </div>
                    <CafeStatusBadge status={cafe.status ?? 'pending'} />
                  </div>
                  <div className="small text-muted my-2">
                    <div>
                      <i className="bi bi-person me-1" />
                      {cafe.owner.name} · {cafe.owner.email}
                    </div>
                    {cafe.gstNumber && <div>GST: {cafe.gstNumber}</div>}
                    {cafe.licenseNumber && <div>License: {cafe.licenseNumber}</div>}
                    <div>
                      {cafe._count.menuItems} items · {cafe._count.orders} orders · {cafe._count.staff} staff
                    </div>
                    <div>Registered {dateTime(cafe.createdAt)}</div>
                  </div>
                  <div className="d-flex gap-2">
                    {cafe.status !== 'approved' && (
                      <button className="btn btn-sm btn-success flex-fill" onClick={() => review(cafe, 'approve')}>
                        Approve
                      </button>
                    )}
                    {cafe.status === 'pending' && (
                      <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => review(cafe, 'reject')}>
                        Reject
                      </button>
                    )}
                    {cafe.status === 'approved' && (
                      <button className="btn btn-sm btn-outline-dark flex-fill" onClick={() => review(cafe, 'suspend')}>
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageState>
    </>
  );
};

const Users = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService
      .users({ q: q || undefined, role: role || undefined, page })
      .then((res) => {
        setUsers(res.data);
        setPages(res.meta.pages);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [q, role, page]);
  useEffect(load, [load]);

  const setStatus = async (u: AdminUser, status: 'active' | 'suspended') => {
    try {
      await adminService.updateUser(u.id, { status });
      toast.success(`${u.name} ${status}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: 240 }}
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 160 }}
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="counter">Counter</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <PageState loading={loading} error={error} empty={users.length === 0} emptyIcon="people" emptyTitle="No users found" onRetry={load}>
        <div className="table-responsive card border-0 shadow-sm rounded-4">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Activity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="fw-semibold">{u.name}</div>
                    <div className="text-muted small">{u.email}</div>
                  </td>
                  <td className="text-capitalize">{u.role}</td>
                  <td className="small text-muted">
                    {u._count.orders} orders · {u._count.ownedCafes} cafes
                    <br />
                    last login {u.lastLoginAt ? dateShort(u.lastLoginAt) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{u.status}</span>
                  </td>
                  <td className="text-end">
                    {u.status === 'active' ? (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(u, 'suspended')}>
                        Suspend
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(u, 'active')}>
                        Reinstate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="d-flex justify-content-between align-items-center pt-3">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="small text-muted">
              Page {page} / {pages}
            </span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </PageState>
    </>
  );
};

const Activity = () => {
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService
      .activity({ page })
      .then((res) => {
        setItems(res.data);
        setPages(res.meta.pages);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page]);
  useEffect(load, [load]);

  return (
    <div className="card border-0 shadow-sm rounded-4" style={{ maxWidth: 780 }}>
      <div className="card-body">
        <PageState loading={loading} error={error} onRetry={load}>
          <ActivityFeed items={items} />
          {pages > 1 && (
            <div className="d-flex justify-content-between align-items-center pt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="small text-muted">
                Page {page} / {pages}
              </span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </PageState>
      </div>
    </div>
  );
};

export default AdminDashboard;
