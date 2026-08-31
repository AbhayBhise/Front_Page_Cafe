import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { cafeService } from '../../services/cafeService';
import { Spinner } from '../../components/ui';
import CafeStatusBanner from '../../components/CafeStatusBanner';

const FIELDS: { key: string; label: string; type?: string; col?: string }[] = [
  { key: 'name', label: 'Cafe name', col: 'col-md-6' },
  { key: 'phone', label: 'Phone', col: 'col-md-6' },
  { key: 'email', label: 'Public email', type: 'email', col: 'col-md-6' },
  { key: 'taxRate', label: 'Tax rate (%)', type: 'number', col: 'col-md-6' },
  { key: 'welcomeMessage', label: 'Welcome message (shown on the QR landing page)', col: 'col-12' },
  { key: 'announcement', label: 'Announcement / offer banner', col: 'col-12' },
  { key: 'addressLine', label: 'Address', col: 'col-12' },
  { key: 'city', label: 'City', col: 'col-md-4' },
  { key: 'state', label: 'State', col: 'col-md-4' },
  { key: 'postalCode', label: 'Postal code', col: 'col-md-4' },
  { key: 'gstNumber', label: 'GST number', col: 'col-md-6' },
  { key: 'licenseNumber', label: 'FSSAI / License', col: 'col-md-6' },
  { key: 'logoUrl', label: 'Logo URL', col: 'col-md-6' },
  { key: 'bannerUrl', label: 'Banner URL', col: 'col-md-6' },
  { key: 'description', label: 'Description', col: 'col-12' },
];

const CafeSettings = () => {
  const { cafe, cafeId, loading, reload } = useOwnerCafe();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cafe) {
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => {
        next[f.key] = String((cafe as unknown as Record<string, unknown>)[f.key] ?? '');
      });
      setForm(next);
    }
  }, [cafe]);

  if (loading) return <Spinner />;
  if (!cafe) return <p className="container py-5 text-muted">No cafe found.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setSaving(true);
    const patch: Record<string, unknown> = {};
    FIELDS.forEach((f) => {
      const v = form[f.key]?.trim();
      if (f.type === 'number') patch[f.key] = v ? Number(v) : undefined;
      else patch[f.key] = v || null;
    });
    try {
      await cafeService.patchCafe(cafeId, patch);
      toast.success('Cafe details saved');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: '70vh', maxWidth: 820 }}>
      <h2 className="fw-bold mb-3">Cafe settings</h2>
      <CafeStatusBanner cafe={cafe} />
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <form className="row g-3" onSubmit={submit}>
            {FIELDS.map((f) => (
              <div className={f.col ?? 'col-md-6'} key={f.key}>
                <label className="form-label small fw-semibold">{f.label}</label>
                {['description', 'welcomeMessage', 'announcement'].includes(f.key) ? (
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className="form-control"
                    type={f.type ?? 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="col-12">
              <button className="btn btn-primary fw-bold" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CafeSettings;
