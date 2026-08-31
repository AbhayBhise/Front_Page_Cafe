import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { dateTime } from '../lib/format';
import BackButton from '../components/BackButton';

interface Session {
  id: string;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: string;
  expiresAt: string;
}

const Settings = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    authService
      .sessions()
      .then((s) => setSessions(s as Session[]))
      .catch(() => undefined);
  }, []);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(current, next);
      toast.success('Password changed — other devices were signed out');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: '70vh', maxWidth: 780 }}>
      <BackButton fallbackPath="/profile" />
      <h2 className="fw-bold mb-4">Account settings</h2>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-shield-lock me-2 text-primary" /> Change password
          </h5>
          <form onSubmit={changePassword} className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-semibold">Current password</label>
              <input type="password" className="form-control" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">New password</label>
              <input type="password" className="form-control" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
              <div className="form-text">At least 8 characters, with an uppercase letter or number.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Confirm new password</label>
              <input type="password" className="form-control" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <div className="col-12">
              <button className="btn btn-primary fw-bold" disabled={saving}>
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-laptop me-2 text-primary" /> Active sessions
          </h5>
          {sessions.length === 0 ? (
            <p className="text-muted small mb-0">No other active sessions.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {sessions.map((s) => (
                <li key={s.id} className="list-group-item px-0 d-flex justify-content-between">
                  <span className="small text-truncate" style={{ maxWidth: '70%' }}>
                    {s.userAgent || 'Unknown device'}
                  </span>
                  <span className="text-muted small">{dateTime(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="form-text mb-0">Changing your password signs out every other session.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
