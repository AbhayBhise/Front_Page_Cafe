import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MenuBrowser from '../components/MenuBrowser';
import { PageState } from '../components/ui';
import { Shimmer, MenuItemSkeleton } from '../components/Shimmer';
import { menuService, type PublicMenu } from '../services/menuService';
import { useCartStore } from '../store/cartStore';
import { money } from '../lib/format';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200';

const CafeMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartCount = useCartStore((s) => s.itemCount);
  const cartTotal = useCartStore((s) => s.subtotal);
  const cartCafeId = useCartStore((s) => s.cafeId);

  const load = () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    menuService
      .getPublicMenu(slug)
      .then(setMenu)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load menu'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  return (
    <PageState
      loading={loading}
      loadingComponent={
        <div>
          <div
            style={{ minHeight: 260, backgroundColor: 'rgba(217, 119, 6, 0.08)' }}
            className="p-4 d-flex align-items-end"
          >
            <div className="container">
              <Shimmer width="45%" height={36} borderRadius={8} className="mb-2" />
              <Shimmer width="20%" height={24} borderRadius={12} className="mb-2" />
              <Shimmer width="65%" height={16} borderRadius={6} />
            </div>
          </div>
          <div className="container py-4">
            <div className="row g-4">
              <div className="col-lg-3 d-none d-lg-block">
                <Shimmer height={42} borderRadius={8} className="mb-2" />
                <Shimmer height={42} borderRadius={8} className="mb-2" />
                <Shimmer height={42} borderRadius={8} className="mb-2" />
                <Shimmer height={42} borderRadius={8} className="mb-2" />
              </div>
              <div className="col-lg-9">
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div className="col" key={idx}>
                      <MenuItemSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      error={error}
      onRetry={load}
    >
      {menu && (
        <>
          <div
            className="d-flex flex-column justify-content-end text-white p-4"
            style={{
              minHeight: 300,
              background: `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.6)), url(${menu.cafe.bannerUrl || FALLBACK_BANNER}) center/cover`,
            }}
          >
            <div className="container">
              <h1 className="fw-bold mb-2">{menu.cafe.name}</h1>
              <span className={`badge ${menu.cafe.isOpen ? 'bg-success' : 'bg-secondary'} mb-2`}>
                {menu.cafe.isOpen ? 'Open now' : 'Currently closed'}
              </span>
              <p className="mb-0" style={{ maxWidth: 640 }}>
                {menu.cafe.welcomeMessage || menu.cafe.description}
              </p>
            </div>
          </div>

          <div className="container py-4" style={{ minHeight: '50vh' }}>
            {menu.cafe.announcement && (
              <div className="alert alert-warning d-flex align-items-center gap-2">
                <i className="bi bi-megaphone-fill" />
                <span>{menu.cafe.announcement}</span>
              </div>
            )}
            {!menu.cafe.isOpen && (
              <div className="alert alert-secondary">
                This cafe is not accepting orders right now — you can still browse the menu.
              </div>
            )}
            <div className="alert alert-light border d-flex align-items-center gap-2 small">
              <i className="bi bi-qr-code fs-5" />
              Dining in? Scan the QR code on your table to order without an account.
            </div>

            <MenuBrowser menu={menu} disabled={!menu.cafe.isOpen} />
          </div>

          {cartCount > 0 && cartCafeId === menu.cafe.id && (
            <div
              className="position-fixed bottom-0 start-50 translate-middle-x mb-3 shadow-lg"
              style={{ zIndex: 1040, width: 'min(92%, 460px)' }}
            >
              <Link
                to="/cart"
                className="btn btn-primary w-100 py-3 d-flex justify-content-between align-items-center rounded-pill text-decoration-none"
              >
                <span>
                  <i className="bi bi-cart-check me-2" />
                  {cartCount} item{cartCount > 1 ? 's' : ''}
                </span>
                <span className="fw-bold">
                  {money(cartTotal)} · View cart <i className="bi bi-arrow-right ms-1" />
                </span>
              </Link>
            </div>
          )}
        </>
      )}
    </PageState>
  );
};

export default CafeMenu;
