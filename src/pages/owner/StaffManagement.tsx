import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { cafeService } from '../../services/cafeService';
import { PageState } from '../../components/ui';
import { timeAgo } from '../../lib/format';
import CafeStatusBanner from '../../components/CafeStatusBanner';
import type { CafeStaff, Counter, PresenceEntry } from '../../types';

const StaffManagement = () => {
  const { cafe, cafeId } = useOwnerCafe();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [staff, setStaff] = useState<CafeStaff[]>([]);
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [counterForm, setCounterForm] = useState({ name: '', code: '' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', title: 'Counter Staff', counterId: '' });

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    Promise.all([cafeService.listCounters(cafeId), cafeService.listStaff(cafeId), cafeService.presence(cafeId)])
      .then(([c, s, p]) => {
        setCounters(c);
        setStaff(s);
        setPresence(p.staff);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [cafeId]);

  useEffect(load, [load]);
  useSocketEvent<{ cafeId: string; staff: PresenceEntry[] }>('presence:update', (p) => {
    if (p.cafeId === cafeId) setPresence(p.staff);
  });

  const online = (userId: string) => presence.find((p) => p.userId === userId && p.online);

  const addCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    try {
      await cafeService.createCounter(cafeId, { name: counterForm.name.trim(), code: counterForm.code.trim() });
      setCounterForm({ name: '', code: '' });
      toast.success('Counter added');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add counter');
    }
  };

  const deleteCounter = async (id: string) => {
    if (!cafeId || !window.confirm('Delete this counter?')) return;
    try {
      await cafeService.deleteCounter(cafeId, id);
      toast.success('Counter removed');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    try {
      await cafeService.createStaff(cafeId, {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        title: staffForm.title.trim(),
        counterId: staffForm.counterId || null,
      });
      setStaffForm({ name: '', email: '', password: '', title: 'Counter Staff', counterId: '' });
      toast.success('Staff account created');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create staff');
    }
  };

  const updateStaff = async (s: CafeStaff, patch: Partial<CafeStaff>) => {
    if (!cafeId) return;
    try {
      await cafeService.updateStaff(cafeId, s.id, patch);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  const removeStaff = async (s: CafeStaff) => {
    if (!cafeId || !window.confirm(`Remove ${s.user?.name}? Their account will be disabled.`)) return;
    try {
      await cafeService.removeStaff(cafeId, s.id);
      toast.success('Staff removed');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove');
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <h2 className="fw-bold mb-3">Staff &amp; counters</h2>
      <CafeStatusBanner cafe={cafe} />

      <PageState loading={loading} error={error} onRetry={load}>
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Counters</h6>
                {counters.length === 0 && <p className="text-muted small">No counters yet.</p>}
                <ul className="list-group list-group-flush mb-3">
                  {counters.map((c) => (
                    <li key={c.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span>
                        <span className="fw-semibold">{c.name}</span>{' '}
                        <span className="badge bg-light text-dark">{c.code}</span>
                        {!c.isActive && <span className="badge bg-secondary ms-1">inactive</span>}
                      </span>
                      <button className="btn btn-sm btn-link text-danger" onClick={() => deleteCounter(c.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form className="row g-2" onSubmit={addCounter}>
                  <div className="col-6">
                    <input className="form-control form-control-sm" placeholder="Name" required value={counterForm.name} onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })} />
                  </div>
                  <div className="col-4">
                    <input className="form-control form-control-sm" placeholder="Code" required value={counterForm.code} onChange={(e) => setCounterForm({ ...counterForm, code: e.target.value })} />
                  </div>
                  <div className="col-2">
                    <button className="btn btn-sm btn-outline-primary w-100" type="submit">
                      +
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Add counter staff</h6>
                <form className="row g-2" onSubmit={addStaff}>
                  <div className="col-md-6">
                    <input className="form-control form-control-sm" placeholder="Full name" required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <input className="form-control form-control-sm" placeholder="Title" value={staffForm.title} onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control form-control-sm" placeholder="Email" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <input type="password" className="form-control form-control-sm" placeholder="Temp password" required minLength={8} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                  </div>
                  <div className="col-md-8">
                    <select className="form-select form-select-sm" value={staffForm.counterId} onChange={(e) => setStaffForm({ ...staffForm, counterId: e.target.value })}>
                      <option value="">No fixed counter</option>
                      {counters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button className="btn btn-sm btn-primary w-100" type="submit">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Team ({staff.length})</h6>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Counter</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="fw-semibold">
                              <i
                                className={`bi bi-circle-fill me-2 ${online(s.userId) ? 'text-success' : 'text-secondary'}`}
                                style={{ fontSize: 8 }}
                              />
                              {s.user?.name}
                            </div>
                            <div className="text-muted small">{s.user?.email}</div>
                            <div className="text-muted small">
                              {online(s.userId)
                                ? 'online now'
                                : s.user?.lastLoginAt
                                  ? `last seen ${timeAgo(s.user.lastLoginAt)}`
                                  : 'never signed in'}
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={s.counterId ?? ''}
                              onChange={(e) => updateStaff(s, { counterId: e.target.value || null })}
                            >
                              <option value="">—</option>
                              {counters.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={s.isActive}
                                onChange={(e) => updateStaff(s, { isActive: e.target.checked })}
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeStaff(s)}>
                              <i className="bi bi-person-x" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staff.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-3">
                            No staff yet.
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
      </PageState>
    </div>
  );
};

export default StaffManagement;
