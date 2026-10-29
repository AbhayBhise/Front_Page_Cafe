import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import PartnerSection from '../components/PartnerSection';
import CafeCard from '../components/CafeCard';
import { Spinner } from '../components/ui';
import { cafeService } from '../services/cafeService';
import type { Cafe } from '../types';

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

const SIMULATED_STAGES = [
  {
    key: 'pending',
    title: '1. Order Placed',
    customerStatus: 'Order Placed',
    customerEta: '~15 min',
    queuePos: '#3 in queue',
    customerDesc: 'Your order was instantly received by the cafe POS and queued.',
    ownerAction: 'Incoming ticket alerted with chime on kitchen console.',
    color: '#0d6efd',
    icon: 'bag-plus',
  },
  {
    key: 'accepted',
    title: '2. Kitchen Accepted',
    customerStatus: 'Kitchen Accepted',
    customerEta: '~12 min',
    queuePos: '#2 in queue',
    customerDesc: 'The barista has confirmed your ticket and added it to active prep.',
    ownerAction: 'Ticket moved to active kitchen counter board.',
    color: '#0dcaf0',
    icon: 'check2-circle',
  },
  {
    key: 'preparing',
    title: '3. In the Oven & Grinder',
    customerStatus: 'Preparing Fresh',
    customerEta: '~5 min',
    queuePos: '#1 in queue',
    customerDesc: 'Beans are being freshly ground and pizza crust is in the oven.',
    ownerAction: 'Kitchen timer running with live workload calculation.',
    color: '#fd7e14',
    icon: 'fire',
  },
  {
    key: 'ready',
    title: '4. Ready for You!',
    customerStatus: 'Ready for Pickup',
    customerEta: 'Ready now!',
    queuePos: 'Next up',
    customerDesc: 'Your hot brew and fresh bites are waiting at the counter / table.',
    ownerAction: 'One-click dispatch alert sent to guest phone & counter screen.',
    color: '#198754',
    icon: 'bag-check-fill',
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
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const [activeStageIdx, setActiveStageIdx] = useState(2); // default to 'preparing'

  useEffect(() => {
    cafeService
      .discover({ pageSize: 6 })
      .then((res) => setCafes(res.data))
      .catch(() => setCafes([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleCafes = filter === 'open' ? cafes.filter((c) => c.isOpen) : cafes;
  const currentStage = SIMULATED_STAGES[activeStageIdx];

  return (
    <>
      {/* Enhanced Hero Section with dynamic typing and curated photo carousel */}
      <Hero />

      {/* Artisanal Flavor Cravings Bar */}
      <section className="container my-4">
        <div className="card border-0 rounded-4 shadow-sm p-4" style={{ backgroundColor: '#fff9f2', border: '1px solid rgba(139, 69, 19, 0.12)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold m-0" style={{ color: '#2c1810' }}>
                <i className="bi bi-compass me-2 text-warning" />
                Craving Something Special?
              </h5>
              <small className="text-muted">Explore handcrafted categories across our partner cafes</small>
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
                    style={{ backgroundColor: '#ffffff', borderColor: '#f1e2cc', transition: 'all 0.2s ease' }}
                  >
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                      style={{ width: 48, height: 48, backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#b45309' }}
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
          <Spinner />
        ) : visibleCafes.length === 0 ? (
          <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ backgroundColor: '#fff9f2' }}>
            <i className="bi bi-shop text-muted fs-1 mb-2" />
            <h5 className="fw-bold">No cafes found</h5>
            <p className="text-muted small mb-3">There are no cafes matching this filter right now.</p>
            <button className="btn btn-sm btn-outline-secondary mx-auto" onClick={() => setFilter('all')}>
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

      {/* Interactive Live Order State Tracing Showcase */}
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
                <i className="bi bi-broadcast me-1" /> Real-time Live Sync
              </span>
              <h2 className="fw-bold mb-3 text-white" style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)' }}>
                Live Order Tracing for Guests & Cafe Owners
              </h2>
              <p className="text-light opacity-75 small mb-4" style={{ lineHeight: 1.7 }}>
                Every order placed via Table QR or online is synchronized instantly using WebSockets. The guest sees kitchen ETA countdowns, while the cafe owner and kitchen staff receive real-time ticket queues.
              </p>

              {/* Stage Selector Buttons */}
              <div className="d-flex flex-column gap-2 mb-4">
                <small className="text-warning fw-semibold text-uppercase tracking-wide">
                  Click to simulate live order stages:
                </small>
                <div className="d-flex flex-wrap gap-2">
                  {SIMULATED_STAGES.map((stage, idx) => (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => setActiveStageIdx(idx)}
                      className={`btn btn-sm rounded-pill px-3 fw-medium ${
                        activeStageIdx === idx
                          ? 'btn-warning text-dark shadow-sm'
                          : 'btn-outline-light'
                      }`}
                    >
                      {stage.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-3">
                <Link to="/orders" className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill shadow-sm">
                  <i className="bi bi-bag-check me-2" />
                  View Your Orders
                </Link>
                <Link to="/cafes" className="btn btn-outline-light fw-medium px-4 py-2 rounded-pill">
                  Place an Order
                </Link>
              </div>
            </div>

            {/* Interactive Dual-Perspective Visualizer Card */}
            <div className="col-lg-7">
              <div className="row g-3">
                {/* 1. Customer Phone View */}
                <div className="col-md-6">
                  <div className="card border-0 rounded-4 shadow bg-white text-dark p-3 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <span className="badge bg-light text-muted border">
                        <i className="bi bi-phone me-1" /> Customer View
                      </span>
                      <span className="small text-muted">Order #FP-1048</span>
                    </div>

                    <div className="text-center my-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle p-3 mb-2"
                        style={{ backgroundColor: `${currentStage.color}1a`, color: currentStage.color }}
                      >
                        <i className={`bi bi-${currentStage.icon} fs-2`} />
                      </div>
                      <h5 className="fw-bold mb-1">{currentStage.customerStatus}</h5>
                      <span className="badge bg-dark rounded-pill px-3 py-1">
                        Table 04 · Dine-in
                      </span>
                    </div>

                    <div className="bg-light rounded-3 p-3 mb-3 text-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-start">
                          <small className="text-muted d-block">Estimated Ready</small>
                          <strong className="fs-5 text-dark">{currentStage.customerEta}</strong>
                        </div>
                        <div className="text-end">
                          <small className="text-muted d-block">Queue Pos</small>
                          <span className="badge bg-warning text-dark fw-bold">
                            {currentStage.queuePos}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="small text-muted mb-0">
                      <i className="bi bi-info-circle me-1 text-primary" />
                      {currentStage.customerDesc}
                    </p>
                  </div>
                </div>

                {/* 2. Restaurant Owner & Kitchen Console View */}
                <div className="col-md-6">
                  <div
                    className="card border-0 rounded-4 shadow p-3 h-100 text-white"
                    style={{ backgroundColor: '#1f130d', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-display me-1" /> Kitchen & Owner Console
                      </span>
                      <span className="small text-success">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.6rem' }} /> Live Synced
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Active Kitchen Backlog</small>
                        <span className="badge bg-secondary">3 active tickets</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{ width: `${(activeStageIdx + 1) * 25}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-3 my-3" style={{ backgroundColor: '#2a1a12' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-white small">Order #FP-1048</strong>
                        <span className="badge" style={{ backgroundColor: currentStage.color }}>
                          {currentStage.key.toUpperCase()}
                        </span>
                      </div>
                      <div className="small text-light opacity-75">
                        1x Sourdough Margherita, 1x Ethiopian Pour-Over
                      </div>
                    </div>

                    <p className="small text-light opacity-75 mb-0 mt-auto">
                      <i className="bi bi-bell-fill text-warning me-1" />
                      {currentStage.ownerAction}
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
            From table scan to your first sip, experience modern cafe ordering designed for speed and comfort.
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

      {/* Why Guests Love Front Page Cafe (4-Pillar Grid) */}
      <section className="container my-5">
        <div
          className="card border-0 rounded-4 shadow-sm p-4 p-md-5"
          style={{ backgroundColor: '#fff9f2', border: '1px solid rgba(139, 69, 19, 0.15)' }}
        >
          <div className="text-center mb-4">
            <span className="badge rounded-pill bg-warning-subtle text-dark border px-3 py-1 mb-2 fw-semibold">
              The Artisanal Standard
            </span>
            <h2 className="fw-bold mb-2" style={{ color: '#2c1810' }}>
              Why Food & Coffee Lovers Choose Us
            </h2>
            <p className="text-muted small mx-auto" style={{ maxWidth: '520px' }}>
              Built for seamless dining experiences without sacrificing culinary craft.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                <i className="bi bi-qr-code text-warning fs-2 mb-2 d-block" />
                <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>
                  Contactless Table QR
                </h6>
                <p className="text-muted small mb-0">
                  Scan the sticker on your cafe table to customize dishes and pay securely without waiting for menus.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                <i className="bi bi-stopwatch-fill text-danger fs-2 mb-2 d-block" />
                <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>
                  Load-Aware Kitchen ETA
                </h6>
                <p className="text-muted small mb-0">
                  Dynamic wait-time calculation based on active kitchen orders, not arbitrary static timer guesses.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                <i className="bi bi-cup-hot text-primary fs-2 mb-2 d-block" />
                <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>
                  Artisanal Ingredients
                </h6>
                <p className="text-muted small mb-0">
                  Ethically sourced beans, 48-hour slow-fermented pizza doughs, and zero artificial syrups.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="p-3 bg-white rounded-4 border h-100 shadow-xs">
                <i className="bi bi-shield-check text-success fs-2 mb-2 d-block" />
                <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>
                  Multi-Tenant Security
                </h6>
                <p className="text-muted small mb-0">
                  Strict tenant isolation between cafes, verified staff role management, and instant digital receipts.
                </p>
              </div>
            </div>
          </div>
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