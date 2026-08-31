import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../components/ProtectedRoute';

const Signup = () => {
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cafeName: '',
    addressLine: '',
    city: '',
    state: '',
    gstNumber: '',
    licenseNumber: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'owner' && !f.cafeName.trim()) {
      toast.error('Enter your cafe name');
      return;
    }
    setBusy(true);
    const identity = await register({
      name: f.name.trim(),
      email: f.email.trim(),
      password: f.password,
      phone: f.phone.trim() || undefined,
      role,
      cafe:
        role === 'owner'
          ? {
              name: f.cafeName.trim(),
              addressLine: f.addressLine.trim() || undefined,
              city: f.city.trim() || undefined,
              state: f.state.trim() || undefined,
              gstNumber: f.gstNumber.trim() || undefined,
              licenseNumber: f.licenseNumber.trim() || undefined,
            }
          : undefined,
    });
    setBusy(false);
    if (identity) navigate(roleHome(identity.user.role), { replace: true });
  };

  return (
    <div className="container py-5 d-flex flex-column align-items-center">
      <div
        className="card p-4 shadow-sm border-0 rounded-4"
        style={{ width: '100%', maxWidth: role === 'owner' ? 640 : 440 }}
      >
        <h2 className="text-center mb-1 fw-bold">Create your account</h2>
        <p className="text-center text-muted mb-4 small">Join Front Page Cafe</p>

        <div className="d-flex mb-4 p-1 bg-light rounded-pill border">
          <button
            type="button"
            className={`btn flex-grow-1 rounded-pill btn-sm border-0 py-2 ${role === 'customer' ? 'btn-primary text-white' : 'text-muted'}`}
            onClick={() => setRole('customer')}
          >
            I'm a customer
          </button>
          <button
            type="button"
            className={`btn flex-grow-1 rounded-pill btn-sm border-0 py-2 ${role === 'owner' ? 'btn-primary text-white' : 'text-muted'}`}
            onClick={() => setRole('owner')}
          >
            I own a cafe
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Full name</label>
              <input className="form-control" required value={f.name} onChange={set('name')} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" value={f.phone} onChange={set('phone')} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Email</label>
              <input type="email" className="form-control" required value={f.email} onChange={set('email')} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Password</label>
              <input type="password" className="form-control" required minLength={8} value={f.password} onChange={set('password')} />
            </div>

            {role === 'owner' && (
              <>
                <div className="col-12">
                  <hr className="my-1" />
                  <span className="small text-muted fw-semibold">Cafe details — submitted for admin review</span>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Cafe name</label>
                  <input className="form-control" required value={f.cafeName} onChange={set('cafeName')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Address</label>
                  <input className="form-control" value={f.addressLine} onChange={set('addressLine')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">City</label>
                  <input className="form-control" value={f.city} onChange={set('city')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">State</label>
                  <input className="form-control" value={f.state} onChange={set('state')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">GST no.</label>
                  <input className="form-control" value={f.gstNumber} onChange={set('gstNumber')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">FSSAI / License no.</label>
                  <input className="form-control" value={f.licenseNumber} onChange={set('licenseNumber')} />
                </div>
              </>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold mt-4" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <p className="mb-0 text-muted small">
            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
