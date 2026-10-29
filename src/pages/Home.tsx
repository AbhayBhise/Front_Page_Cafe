import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import PartnerSection from '../components/PartnerSection';
import CafeCard from '../components/CafeCard';
import { CafeCardSkeleton } from '../components/Shimmer';
import { cafeService } from '../services/cafeService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import type { Cafe, Order } from '../types';

const CATEGORIES = [
  { icon: 'cup-hot-fill', label: 'Specialty Coffee', desc: 'Single-origin pour-overs & lattes' },
  { icon: 'pie-chart-fill', label: 'Artisanal Pizza', desc: 'Wood-fired sourdough crusts' },
  { icon: 'bag-heart-fill', label: 'Bakery & Bakes', desc: 'Flaky croissants & brioche' },
  { icon: 'egg-fried', label: 'Gourmet Brunch', desc: 'Avocado toasts & egg bowls' },
  { icon: 'water', label: 'Chilled Coolers', desc: 'Craft spritzers & iced brews' },
];

const STEPS = [
  {
    icon: 'shop',
    title: 'Select an Artisan Cafe',
    text: 'Explore verified neighborhood roasters, verified menus, and live kitchen backlog times.',
  },
  {
    icon: 'qr-code-scan',
    title: 'Scan Table QR or Order Ahead',
    text: 'Dine-in with table QR code or order takeaway with seamless digital customization.',
  },
  {
    icon: 'stopwatch',
    title: 'Track Live Kitchen ETA',
    text: 'See your real-time queue position and load-aware preparation countdown powered by WebSockets.',
  },
  {
    icon: 'cup-straw',
    title: 'Enjoy Freshly Served',
    text: 'Receive instant alerts the moment your order is plated or boxed. Zero awkward waiting.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'The table QR ordering is phenomenal. We walked into Front Page Cafe, scanned the table code, and our specialty pour-overs arrived within 8 minutes!',
    author: 'Aarav Sharma',
    role: 'Coffee Enthusiast · Pune',
    rating: 5,
  },
  {
    quote: 'The live kitchen queue ETA is spot on. I can order my wood-fired sourdough pizza while finishing work and pick it up right as it comes out piping hot.',
    author: 'Priya Kulkarni',
    role: 'Food & Travel Writer',
    rating: 5,
  },
  {
    quote: 'As a cafe manager, having the counter console update orders in real time without refreshing saves our staff dozens of manual calls every single rush hour.',
    author: 'Rohan Deshmukh',
    role: 'Partner Cafe Operator',
    rating: 5,
  },
];

const Home = () => {
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    cafeService
      .discover({ pageSize: 6 })
      .then((res) => setCafes(res.data))
      .catch(() => setCafes([]))
      .finally(() => setLoading(false));
  }, []);

  // Only check and display an active order banner IF the user actually placed one
  useEffect(() => {
    if (!user) {
      setActiveOrder(null);
      return;
    }
    orderService
      .mine({ status: 'active' })
      .then((res) => {
        const found = res.data.find((o) =>
          ['pending', 'accepted', 'preparing', 'ready'].includes(o.status),
        );
        setActiveOrder(found || null);
      })
      .catch(() => setActiveOrder(null));
  }, [user]);

  useSocketEvent<Order>('order:updated', (updated) => {
    if (['pending', 'accepted', 'preparing', 'ready'].includes(updated.status)) {
      setActiveOrder(updated);
    } else {
      setActiveOrder(null);
    }
  });

  const visibleCafes = filter === 'open' ? cafes.filter((c) => c.isOpen) : cafes;

  return (
    <>
      {/* Real-time Floating Order Status Banner — ONLY renders if the user has an actual live order in progress */}
      {activeOrder && (
        <div className="container mt-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert border-0 shadow-sm rounded-4 p-3 d-flex justify-content-between align-items-center flex-wrap gap-2 text-white"
            style={{ backgroundColor: '#2c1810' }}
          >
            <div className="d-flex align-items-center gap-3">
              <span className="spinner-grow spinner-grow-sm text-warning" role="status" />
              <div>
                <strong className="d-block text-warning">
                  Active Order #{activeOrder.orderNumber} · {activeOrder.status.toUpperCase()}
                </strong>
                <small className="text-light opacity-75">
                  {activeOrder.cafe?.name || 'Front Page Cafe'} ·{' '}
                  {activeOrder.status === 'ready'
                    ? 'Ready for pickup!'
                    : `Estimated prep: ~${activeOrder.etaMinutes ?? 10} min`}
                </small>
              </div>
            </div>
            <Link
              to={`/orders/${activeOrder.id}`}
              className="btn btn-warning text-dark btn-sm rounded-pill px-3 fw-bold shadow-sm"
            >
              Track Live Order <i className="bi bi-arrow-right ms-1" />
            </Link>
          </motion.div>
        </div>
      )}

      {/* Enhanced Hero Section with dynamic typing and curated photo carousel */}
      <Hero />

      {/* Artisanal Flavor Cravings Bar */}
      <section className="container my-4">
        <div
          className="card border-0 rounded-4 shadow-sm p-4"
          style={{ backgroundColor: '#fff9f2', border: '1px solid rgba(139, 69, 19, 0.12)' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold m-0" style={{ color: '#2c1810' }}>
                <i className="bi bi-compass me-2 text-warning" />
                Craving Something Special?
              </h5>
              <small className="text-muted">
                Explore handcrafted categories across our partner cafes
              </small>
            </div>
            <Link to="/cafes" className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-medium">
              View All Menus <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>

          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3">
            {CATEGORIES.map((cat, idx) => (
              <div className="col" key={idx}>
                <Link to="/cafes" className="text-decoration-none text-reset">
                  <motion.div
                    whileHover={{ y: -4, backgroundColor: '#faebd7' }}
                    className="p-3 rounded-4 border text-center h-100 d-flex flex-column justify-content-center align-items-center"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#f1e2cc',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: 'rgba(217, 119, 6, 0.12)',
                        color: '#b45309',
                      }}
                    >
                      <i className={`bi bi-${cat.icon} fs-4`} />
                    </div>
                    <div className="fw-bold small mb-1" style={{ color: '#2c1810' }}>
                      {cat.label}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {cat.desc}
                    </div>
                  </motion.div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cafes Section with Filter Tabs */}
      <section className="container my-5">
        <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
          <div>
            <span
              className="badge rounded-pill mb-1 px-3 py-1 fw-semibold"
              style={{ backgroundColor: 'rgba(139, 69, 19, 0.12)', color: '#8b4513' }}
            >
              Handcrafted Spots
            </span>
            <h2 className="fw-bold m-0" style={{ color: '#2c1810' }}>
              Order From Verified Artisan Cafes
            </h2>
            <p className="text-muted small mb-0 mt-1">
              Select a cafe to browse their seasonal menu, order ahead, or scan table QR.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${filter === 'all' ? 'btn-dark' : 'btn-outline-dark'} rounded-pill px-3`}
                onClick={() => setFilter('all')}
              >
                All Cafes ({cafes.length})
              </button>
              <button
                type="button"
                className={`btn ${filter === 'open' ? 'btn-success text-white' : 'btn-outline-success'} rounded-pill px-3 ms-1`}
                onClick={() => setFilter('open')}
              >
                <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.6rem' }} />
                Open Now ({cafes.filter((c) => c.isOpen).length})
              </button>
            </div>
            <Link to="/cafes" className="btn btn-outline-primary btn-sm rounded-pill px-3 ms-2">
              Browse All <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div className="col" key={idx}>
                <CafeCardSkeleton />
              </div>
            ))}
          </div>
        ) : visibleCafes.length === 0 ? (
          <div
            className="card border-0 rounded-4 p-5 text-center shadow-sm"
            style={{ backgroundColor: '#fff9f2' }}
          >
            <i className="bi bi-shop text-muted fs-1 mb-2" />
            <h5 className="fw-bold">No cafes found</h5>
            <p className="text-muted small mb-3">
              There are no cafes matching this filter right now.
            </p>
            <button
              className="btn btn-sm btn-outline-secondary mx-auto"
              onClick={() => setFilter('all')}
            >
              Show all cafes
            </button>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {visibleCafes.map((cafe) => (
              <div className="col" key={cafe.id}>
                <CafeCard cafe={cafe} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modern Dining Experience Pillars (Inspired by Toast Tab & Starbucks) */}
      <section className="container my-5">
        <div
          className="card border-0 rounded-4 shadow-sm p-4 p-md-5 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #2c1810 0%, #4a2c11 100%)',
            color: '#fff',
          }}
        >
          <div className="row align-items-center g-4">
            <div className="col-lg-5">
              <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-semibold mb-3">
                <i className="bi bi-stars me-1" /> Modern Hospitality Tech
              </span>
              <h2
                className="fw-bold mb-3 text-white"
                style={{ fontSize: 'clamp(1.8rem, 2.5vw, 2.5rem)', lineHeight: 1.25 }}
              >
                Seamless Dining, From Table QR to Final Sip
              </h2>
              <p className="text-light opacity-75 small mb-4" style={{ lineHeight: 1.7 }}>
                Front Page Cafe unites artisanal kitchen craft with frictionless ordering. Whether
                you're seated at a table or grabbing your morning pour-over, every order is synced in
                real time between your phone and the barista's counter.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link
                  to="/cafes"
                  className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill shadow-sm"
                >
                  <i className="bi bi-cup-hot-fill me-2" />
                  Explore Menus
                </Link>
                <Link
                  to="/qr"
                  className="btn btn-outline-light fw-medium px-4 py-2 rounded-pill"
                >
                  <i className="bi bi-qr-code-scan me-2" />
                  Scan Table QR
                </Link>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div
                    className="p-4 rounded-4 h-100 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <i className="bi bi-qr-code-scan fs-2 text-warning mb-3 d-block" />
                    <h5 className="fw-bold mb-2">Contactless Table QR</h5>
                    <p className="small text-light opacity-75 mb-0" style={{ lineHeight: 1.6 }}>
                      No waiting for paper menus or busy staff. Scan the code on your table to
                      customize, re-order, and pay effortlessly.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div
                    className="p-4 rounded-4 h-100 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <i className="bi bi-stopwatch-fill fs-2 text-warning mb-3 d-block" />
                    <h5 className="fw-bold mb-2">Live Kitchen ETA</h5>
                    <p className="small text-light opacity-75 mb-0" style={{ lineHeight: 1.6 }}>
                      Dynamic prep time calculations based on active ticket volume in the kitchen,
                      ensuring honest and accurate wait times.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div
                    className="p-4 rounded-4 h-100 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <i className="bi bi-broadcast fs-2 text-warning mb-3 d-block" />
                    <h5 className="fw-bold mb-2">Real-time Barista Sync</h5>
                    <p className="small text-light opacity-75 mb-0" style={{ lineHeight: 1.6 }}>
                      Instant WebSocket updates connect your order directly to the kitchen
                      display without manual phone calls or paper slips.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div
                    className="p-4 rounded-4 h-100 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <i className="bi bi-cup-straw fs-2 text-warning mb-3 d-block" />
                    <h5 className="fw-bold mb-2">Zero-Wait Pickups</h5>
                    <p className="small text-light opacity-75 mb-0" style={{ lineHeight: 1.6 }}>
                      Get notified the moment your pour-over is extracted or pizza is boxed. Walk
                      up and collect your order at peak temperature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Journey */}
      <section className="container my-5">
        <div className="text-center mb-5">
          <span
            className="badge rounded-pill mb-2 px-3 py-1 fw-semibold"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#b45309' }}
          >
            Simple & Seamless
          </span>
          <h2 className="fw-bold mb-2" style={{ color: '#2c1810' }}>
            How Front Page Cafe Works
          </h2>
          <p className="text-muted small mx-auto" style={{ maxWidth: '500px' }}>
            From table scan to your first sip, experience modern cafe ordering designed for speed
            and comfort.
          </p>
        </div>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {STEPS.map((s, i) => (
            <div className="col" key={s.title}>
              <motion.div
                whileHover={{ y: -6 }}
                className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1e2cc',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="mb-3 position-relative d-inline-block mx-auto">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: 'rgba(217, 119, 6, 0.12)',
                      color: '#b45309',
                    }}
                  >
                    <i className={`bi bi-${s.icon} fs-3`} />
                  </span>
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark text-white"
                    style={{ fontSize: '0.75rem' }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <h6 className="fw-bold mb-2" style={{ color: '#2c1810' }}>
                  {s.title}
                </h6>
                <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                  {s.text}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="container my-5">
        <div className="text-center mb-4">
          <span
            className="badge rounded-pill mb-2 px-3 py-1 fw-semibold"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#b45309' }}
          >
            Guest Stories
          </span>
          <h2 className="fw-bold mb-2" style={{ color: '#2c1810' }}>
            Loved by Neighborhood Coffee Lovers
          </h2>
        </div>

        <div className="row row-cols-1 row-cols-md-3 g-4">
          {TESTIMONIALS.map((t, idx) => (
            <div className="col" key={idx}>
              <div
                className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between"
                style={{ backgroundColor: '#ffffff', border: '1px solid #f1e2cc' }}
              >
                <div>
                  <div className="text-warning mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <i key={i} className="bi bi-star-fill me-1" />
                    ))}
                  </div>
                  <p className="text-muted small mb-4 fst-italic" style={{ lineHeight: 1.7 }}>
                    "{t.quote}"
                  </p>
                </div>
                <div className="d-flex align-items-center gap-3 pt-3 border-top">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: 42, height: 42, backgroundColor: '#8b4513' }}
                  >
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 small" style={{ color: '#2c1810' }}>
                      {t.author}
                    </h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {t.role}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Section */}
      <PartnerSection />
      <div className="py-3" />
    </>
  );
};

export default Home;
