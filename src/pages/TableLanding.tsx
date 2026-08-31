import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { qrService, type QrResolve } from '../services/qrService';
import { menuService, type PublicMenu } from '../services/menuService';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import MenuBrowser from '../components/MenuBrowser';
import { Spinner } from '../components/ui';
import { money } from '../lib/format';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80&w=1400';

const TableLanding = () => {
  const { cafeSlug = '', tableCode = '' } = useParams();
  const [params] = useSearchParams();
  const k = params.get('k') ?? '';
  const navigate = useNavigate();
  const { status, isGuest, guestContext, beginGuestSession, user } = useAuth();

  const [resolved, setResolved] = useState<QrResolve | null>(null);
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [starting, setStarting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.itemCount);
  const cartTotal = useCartStore((s) => s.subtotal);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      qrService.resolve({ cafeSlug, tableCode, k }),
      menuService.getPublicMenu(cafeSlug),
    ])
      .then(([r, m]) => {
        if (cancelled) return;
        setResolved(r.data);
        setMenu(m);
        try {
          sessionStorage.setItem(
            'fpc.tableCtx',
            JSON.stringify({
              cafeId: r.data.cafe.id,
              cafeSlug: r.data.cafe.slug,
              tableId: r.data.table.id,
              tableLabel: r.data.table.label,
            }),
          );
        } catch {
          /* ignore */
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'This QR code is not valid'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cafeSlug, tableCode, k]);

  const guestMatchesTable = isGuest && guestContext?.tableId === resolved?.table.id;
  const canOrderNow = guestMatchesTable || (status === 'authed' && !isGuest);

  const goToCheckout = () => navigate('/checkout');

  const reviewOrder = () => {
    if (cartCount === 0) {
      toast('Add something from the menu first');
      menuRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (canOrderNow) return goToCheckout();
    setChoosing(true);
  };

  const startQuickDine = async () => {
    setStarting(true);
    try {
      const res = await qrService.startSession({ cafeSlug, tableCode, k });
      const identity = await beginGuestSession(res.data);
      if (identity) {
        setChoosing(false);
        goToCheckout();
      } else {
        toast.error('Could not start your table session');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start quick dine');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Spinner label="Loading the menu…" />;

  if (error || !resolved || !menu) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '70vh' }}>
        <i className="bi bi-qr-code-scan display-3 text-muted d-block mb-3" />
        <h3>QR code not valid</h3>
        <p className="text-muted">{error || 'Ask a staff member for an up-to-date code for this table.'}</p>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
          Go to homepage
        </button>
      </div>
    );
  }

  const { cafe, table } = resolved;

  return (
    <>
      {/* Welcome hero */}
      <section
        className="d-flex flex-column justify-content-center align-items-center text-white text-center px-3"
        style={{
          minHeight: 'calc(100vh - 90px)',
          background: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.65)), url(${cafe.bannerUrl || FALLBACK_BANNER}) center/cover`,
        }}
      >
        {cafe.logoUrl && (
          <img
            src={cafe.logoUrl}
            alt=""
            className="rounded-circle mb-3 shadow"
            style={{ width: 84, height: 84, objectFit: 'cover' }}
          />
        )}
        <h1 className="display-5 fw-bold">{cafe.name}</h1>
        <span className="badge bg-light text-dark fs-6 mb-3">
          <i className="bi bi-geo-alt-fill me-1" />
          You're seated at {table.label}
        </span>
        <p className="lead mb-4" style={{ maxWidth: 560 }}>
          {cafe.welcomeMessage || cafe.description || 'Browse the menu and order right from your table.'}
        </p>
        {cafe.announcement && (
          <div className="alert alert-warning d-inline-flex align-items-center gap-2 mb-4">
            <i className="bi bi-megaphone-fill" />
            {cafe.announcement}
          </div>
        )}
        <button
          className="btn btn-light btn-lg rounded-pill px-4"
          onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          View the menu <i className="bi bi-chevron-down ms-1" />
        </button>
      </section>

      {/* Menu */}
      <div ref={menuRef} className="container py-4" style={{ minHeight: '60vh' }}>
        {!cafe.isOpen && (
          <div className="alert alert-secondary">
            The kitchen is closed right now — you can browse but not order.
          </div>
        )}
        {guestMatchesTable && (
          <div className="alert alert-success d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill" />
            Quick dine active — order as many times as you like during your visit.
          </div>
        )}
        <h3 className="fw-bold mb-3">Menu</h3>
        <MenuBrowser menu={menu} disabled={!cafe.isOpen} />
      </div>

      {/* Sticky order bar */}
      {cartCount > 0 && cafe.isOpen && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x mb-3 shadow-lg"
          style={{ zIndex: 1040, width: 'min(94%, 480px)' }}
        >
          <button
            className="btn btn-primary w-100 py-3 d-flex justify-content-between align-items-center rounded-pill"
            onClick={reviewOrder}
          >
            <span>
              <i className="bi bi-basket me-2" />
              {cartCount} item{cartCount > 1 ? 's' : ''}
            </span>
            <span className="fw-bold">
              {money(cartTotal)} · Review order <i className="bi bi-arrow-right ms-1" />
            </span>
          </button>
        </div>
      )}

      {/* Order-choice modal */}
      {choosing && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1060 }}
          onClick={() => setChoosing(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 p-4"
            style={{ width: 'min(92%, 380px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-1">How would you like to order?</h5>
            <p className="text-muted small mb-3">Ordering for {table.label} at {cafe.name}</p>
            <button
              className="btn btn-primary w-100 py-2 mb-2 fw-semibold"
              disabled={starting}
              onClick={startQuickDine}
            >
              {starting ? 'Starting…' : 'Quick dine — no account'}
            </button>
            <p className="text-muted mb-3" style={{ fontSize: 12 }}>
              Secure to this table only. You'll just add your name & phone at checkout.
            </p>
            <button
              className="btn btn-outline-secondary w-100 py-2"
              onClick={() => navigate('/login', { state: { from: '/checkout' } })}
            >
              {user ? 'Continue to checkout' : 'Sign in / create account'}
            </button>
            <button className="btn btn-link w-100 text-muted" onClick={() => setChoosing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TableLanding;
