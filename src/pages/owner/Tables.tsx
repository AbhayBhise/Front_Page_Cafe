import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { cafeService } from '../../services/cafeService';
import { PageState } from '../../components/ui';
import QrCode from '../../components/QrCode';
import CafeStatusBanner from '../../components/CafeStatusBanner';
import type { CafeTable } from '../../types';

const printQr = async (table: CafeTable, cafeName: string) => {
  const dataUrl = await QRCode.toDataURL(table.qrUrl, { width: 560, margin: 1 });
  const w = window.open('', '_blank', 'width=460,height=640');
  if (!w) return;
  w.document.write(`
    <html><head><title>${cafeName} — ${table.label}</title>
    <style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px}
    h1{margin:0 0 4px}h2{margin:0 0 24px;color:#555;font-weight:500}
    img{width:280px;height:280px}p{color:#666;font-size:13px;margin-top:16px}</style></head>
    <body><h1>${cafeName}</h1><h2>${table.label}</h2>
    <img src="${dataUrl}" alt="QR"/>
    <p>Scan to view the menu &amp; order from your table</p>
    <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
    </body></html>`);
  w.document.close();
};

const Tables = () => {
  const { cafe, cafeId } = useOwnerCafe();
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    cafeService
      .listTables(cafeId)
      .then(setTables)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load tables'))
      .finally(() => setLoading(false));
  }, [cafeId]);

  useEffect(load, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !label.trim()) return;
    try {
      await cafeService.createTable(cafeId, { label: label.trim() });
      setLabel('');
      toast.success('Table added');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add table');
    }
  };

  const rotate = async (t: CafeTable) => {
    if (!cafeId || !window.confirm(`Rotate the QR for ${t.label}? Any code already printed for this table stops working.`))
      return;
    try {
      await cafeService.rotateTable(cafeId, t.id);
      toast.success('QR rotated — reprint this table');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not rotate');
    }
  };

  const toggle = async (t: CafeTable) => {
    if (!cafeId) return;
    try {
      await cafeService.updateTable(cafeId, t.id, { isActive: !t.isActive });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  const remove = async (t: CafeTable) => {
    if (!cafeId || !window.confirm(`Delete ${t.label}?`)) return;
    try {
      await cafeService.deleteTable(cafeId, t.id);
      toast.success('Table removed');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <h2 className="fw-bold mb-1">Table QR codes</h2>
      <p className="text-muted">
        Print a QR for each table. Guests scan it to open your menu and order without an account —
        the code is locked to that one table and you can rotate it any time.
      </p>
      <CafeStatusBanner cafe={cafe} />

      <form className="d-flex gap-2 mb-4" style={{ maxWidth: 360 }} onSubmit={add}>
        <input
          className="form-control"
          placeholder="Table label, e.g. Table 12"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <i className="bi bi-plus-lg" />
        </button>
      </form>

      <PageState loading={loading} error={error} empty={tables.length === 0} emptyIcon="qr-code" emptyTitle="No tables yet" onRetry={load}>
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {tables.map((t) => (
            <div className="col" key={t.id}>
              <div className={`card border-0 shadow-sm rounded-4 h-100 ${t.isActive ? '' : 'opacity-50'}`}>
                <div className="card-body text-center">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold mb-0">{t.label}</h6>
                    <span className={`badge ${t.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {t.isActive ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <QrCode value={t.qrUrl} size={150} />
                  <div className="input-group input-group-sm mt-3">
                    <input className="form-control" readOnly value={t.qrUrl} />
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        navigator.clipboard?.writeText(t.qrUrl);
                        toast.success('Link copied');
                      }}
                    >
                      <i className="bi bi-clipboard" />
                    </button>
                  </div>
                  <div className="d-flex gap-1 mt-3">
                    <button className="btn btn-sm btn-primary flex-fill" onClick={() => void printQr(t, cafe?.name ?? 'Cafe')}>
                      <i className="bi bi-printer me-1" /> Print
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" title="Rotate QR" onClick={() => rotate(t)}>
                      <i className="bi bi-arrow-repeat" />
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" title={t.isActive ? 'Disable' : 'Enable'} onClick={() => toggle(t)}>
                      <i className={`bi bi-${t.isActive ? 'pause' : 'play'}`} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => remove(t)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
};

export default Tables;
