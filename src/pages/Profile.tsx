import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dateTime } from '../lib/format';

const Profile = () => {
  const { user, role, cafe, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container py-5" style={{ minHeight: '60vh' }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4" style={{ backgroundColor: '#fcf3e8' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4 gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="rounded-circle" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                ) : (
                  <span
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fs-3 fw-bold"
                    style={{ width: 80, height: 80 }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <h3 className="mb-0">{user.name}</h3>
                  <p className="text-muted mb-0">{user.email}</p>
                  <span className="badge bg-secondary text-capitalize mt-1">{role}</span>
                </div>
              </div>

              <hr />

              <dl className="row mb-0">
                <dt className="col-sm-4 text-muted">Phone</dt>
                <dd className="col-sm-8">{user.phone || '—'}</dd>
                <dt className="col-sm-4 text-muted">Member since</dt>
                <dd className="col-sm-8">{dateTime(user.createdAt)}</dd>
                <dt className="col-sm-4 text-muted">Last login</dt>
                <dd className="col-sm-8">{dateTime(user.lastLoginAt)}</dd>
                {cafe && (
                  <>
                    <dt className="col-sm-4 text-muted">Cafe</dt>
                    <dd className="col-sm-8">
                      {cafe.name} <span className="badge bg-light text-dark">{cafe.status}</span>
                    </dd>
                  </>
                )}
              </dl>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link to="/profile/edit" className="btn btn-outline-primary">
                  <i className="bi bi-pencil me-1" /> Edit profile
                </Link>
                <Link to="/settings" className="btn btn-outline-secondary">
                  <i className="bi bi-gear me-1" /> Settings
                </Link>
                <button onClick={handleLogout} className="btn btn-danger">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
