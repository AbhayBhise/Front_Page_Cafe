import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../components/ProtectedRoute';

const DEMO = [
  ['Customer', 'customer@frontpagecafe.com', 'Customer@12345'],
  ['Cafe owner', 'owner@frontpagecafe.com', 'Owner@12345'],
  ['Counter staff', 'counter@frontpagecafe.com', 'Counter@12345'],
  ['Admin', 'admin@frontpagecafe.com', 'Admin@12345'],
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const identity = await login(email.trim(), password);
    setBusy(false);
    if (identity) navigate(from || roleHome(identity.user.role), { replace: true });
  };

  return (
    <div className="container py-5 d-flex flex-column align-items-center" style={{ minHeight: '80vh', justifyContent: 'center' }}>
      <div className="card p-4 shadow-sm border-0 rounded-4" style={{ width: '100%', maxWidth: 420 }}>
        <h3 className="text-center mb-1 fw-bold">Welcome back</h3>
        <p className="text-center text-muted mb-4 small">Log in to your account</p>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Email address</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-envelope text-muted" /></span>
              <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold small">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><i className="bi bi-lock text-muted" /></span>
              <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold rounded-3" disabled={busy}>
            {busy ? 'Signing in…' : 'Log In'}
          </button>
        </form>
        <div className="text-center mt-4 pt-2 border-top">
          <p className="mb-0 text-muted small">
            Don't have an account? <Link to="/signup" className="text-primary fw-bold text-decoration-none">Create account</Link>
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mt-4" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body">
          <p className="small text-muted mb-2 fw-semibold">Demo accounts — click to fill</p>
          <div className="d-flex flex-wrap gap-2">
            {DEMO.map(([label, e, p]) => (
              <button
                key={e}
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setEmail(e);
                  setPassword(p);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
