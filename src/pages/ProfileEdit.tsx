import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';

const ProfileEdit = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile({
      name: name.trim(),
      phone: phone.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
    });
    setSaving(false);
    if (ok) navigate('/profile');
  };

  return (
    <div className="container py-5" style={{ minHeight: '70vh' }}>
      <BackButton fallbackPath="/profile" />
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">
              <h2 className="fw-bold mb-4 text-center">Edit profile</h2>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full name</label>
                  <input className="form-control form-control-lg" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input className="form-control form-control-lg" value={user.email} disabled />
                  <div className="form-text">Contact support to change your email.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone</label>
                  <input className="form-control form-control-lg" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Avatar image URL</label>
                  <input className="form-control" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary btn-lg fw-bold" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="btn btn-light btn-lg" onClick={() => navigate('/profile')}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
