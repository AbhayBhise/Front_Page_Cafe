import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Typed from 'typed.js';
import { motion } from 'framer-motion';

const CAROUSEL_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200',
    title: 'Specialty Espresso & Pour-Overs',
    subtitle: 'Single-origin beans freshly ground and brewed to perfection',
  },
  {
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200',
    title: 'Wood-Fired Neapolitan Pizzas',
    subtitle: '48-hour fermented dough, San Marzano sauce & fresh mozzarella',
  },
  {
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    title: 'Oven-Fresh Artisanal Bakes',
    subtitle: 'Flaky golden croissants, sourdough toasts & delicate brioches',
  },
  {
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
    title: 'Gourmet Hand-Crafted Burgers',
    subtitle: 'Prime patties, house-made brioche buns & seasoned rustic wedges',
  },
  {
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=1200',
    title: 'Chilled Nitro Cold Brews & Refreshers',
    subtitle: 'Steeped for 18 hours for maximum smoothness and natural sweetness',
  },
];

const Hero = () => {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!el.current) return;
    const typed = new Typed(el.current, {
      strings: [
        'WELCOME TO FRONT PAGE CAFE',
        'Everything Starts With A Coffee.',
        'Given Enough Coffee Everything Is Possible.',
        "Is Everything Okay? 'Yes' Have A Coffee, 'No' Have A Coffee.",
        'Meet, Eat, Drink, Have Fun!',
      ],
      typeSpeed: 70,
      backSpeed: 40,
      backDelay: 2000,
      loop: true,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <div className="container py-3">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card border-0 rounded-4 shadow-sm p-4 p-md-5 mb-4 text-center"
        style={{
          background: 'linear-gradient(135deg, #faebd7 0%, #fdf5eb 50%, #faebd7 100%)',
          border: '1px solid rgba(139, 69, 19, 0.15)',
        }}
      >
        <div className="d-flex justify-content-center mb-3">
          <span
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              color: '#92400e',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <i className="bi bi-stars text-warning" />
            Specialty Roasters · Fresh Oven Bakes · Real-time Table Sync
          </span>
        </div>

        <h1
          className="fw-bold mb-2"
          style={{
            color: '#2c1810',
            fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
            letterSpacing: '-0.5px',
          }}
        >
          Front Page Cafe
        </h1>

        <div
          className="fs-4 fw-semibold mb-3 d-flex align-items-center justify-content-center"
          style={{ color: '#b45309', minHeight: '2.5rem' }}
        >
          <span ref={el}></span>
        </div>

        <p
          className="text-muted mx-auto mb-4 fs-6"
          style={{ maxWidth: '640px', lineHeight: '1.6' }}
        >
          Discover hand-crafted coffee, gourmet bites, and artisanal dining. Scan your table QR code for instant dine-in service or order ahead with live queue tracking.
        </p>

        {/* Action CTAs */}
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
          <Link
            to="/cafes"
            className="btn btn-lg px-4 py-2 text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2"
            style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
          >
            <i className="bi bi-compass" />
            Explore Cafes & Menus
          </Link>
          <Link
            to="/qr"
            className="btn btn-lg px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
            style={{
              backgroundColor: '#fff9f2',
              borderColor: '#c87d55',
              color: '#4a2c11',
            }}
          >
            <i className="bi bi-qr-code-scan text-primary" />
            Scan Table QR
          </Link>
          <Link
            to="/orders"
            className="btn btn-lg px-4 py-2 btn-light border fw-semibold text-secondary d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-stopwatch text-warning" />
            Track Live Order
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="d-flex flex-wrap justify-content-center gap-2 pt-2 border-top">
          <span className="badge rounded-pill bg-white text-secondary border px-3 py-2 fw-medium shadow-sm">
            <i className="bi bi-lightning-charge-fill text-warning me-1" /> ~12 min Kitchen ETA
          </span>
          <span className="badge rounded-pill bg-white text-secondary border px-3 py-2 fw-medium shadow-sm">
            <i className="bi bi-phone-fill text-primary me-1" /> Contactless Table QR
          </span>
          <span className="badge rounded-pill bg-white text-secondary border px-3 py-2 fw-medium shadow-sm">
            <i className="bi bi-broadcast text-success me-1" /> Live WebSocket Sync
          </span>
          <span className="badge rounded-pill bg-white text-secondary border px-3 py-2 fw-medium shadow-sm">
            <i className="bi bi-cup-hot-fill text-danger me-1" /> Single-Origin Beans
          </span>
        </div>
      </motion.div>

      {/* Atmospheric Photo Carousel with Overlay Cards */}
      <div
        id="carouselExampleRide"
        className="carousel slide position-relative rounded-4 overflow-hidden shadow-sm"
        data-bs-ride="carousel"
        data-bs-interval="4500"
      >
        <div className="carousel-indicators">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target="#carouselExampleRide"
              data-bs-slide-to={idx}
              className={idx === 0 ? 'active' : ''}
              aria-current={idx === 0 ? 'true' : undefined}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="carousel-inner" style={{ maxHeight: '460px' }}>
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`carousel-item ${idx === 0 ? 'active' : ''}`}
              style={{ maxHeight: '460px' }}
            >
              <img
                src={slide.image}
                className="d-block w-100"
                alt={slide.title}
                style={{
                  height: '460px',
                  objectFit: 'cover',
                  filter: 'brightness(0.88)',
                }}
              />
              <div
                className="carousel-caption d-none d-md-block text-start rounded-4 px-4 py-3"
                style={{
                  bottom: '30px',
                  left: '40px',
                  right: 'auto',
                  maxWidth: '520px',
                  backgroundColor: 'rgba(44, 24, 16, 0.72)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <h5 className="fw-bold text-white mb-1">{slide.title}</h5>
                <p className="small text-light mb-0" style={{ opacity: 0.9 }}>
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleRide"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleRide"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
};

export default Hero;
