import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import PartnerSection from '../components/PartnerSection';
import CafeCard from '../components/CafeCard';
import { Spinner } from '../components/ui';
import { cafeService } from '../services/cafeService';
import type { Cafe } from '../types';

const STEPS = [
  { icon: 'shop', title: 'Pick a cafe', text: 'Browse partner cafes near you and open their live menu.' },
  { icon: 'cart-check', title: 'Build your order', text: 'Add items, choose dine-in or takeaway, pay securely.' },
  { icon: 'stopwatch', title: 'Track in real time', text: 'See a kitchen-load-aware ETA and your live queue position.' },
  { icon: 'bag-heart', title: 'Skip the wait', text: 'Walk up when it is ready — the counter already knows you.' },
];

const Home = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cafeService
      .discover({ pageSize: 6 })
      .then((res) => setCafes(res.data))
      .catch(() => setCafes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero />

      <section className="container my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Order from our cafes</h2>
          <Link to="/cafes" className="btn btn-outline-primary btn-sm">
            View all <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : cafes.length === 0 ? (
          <p className="text-muted text-center py-4">No cafes are live right now — check back soon.</p>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {cafes.map((cafe) => (
              <div className="col" key={cafe.id}>
                <CafeCard cafe={cafe} />
              </div>
            ))}
          </div>
        )}
      </section>

      <hr />

      <section className="container my-5">
        <h2 className="fw-bold text-center mb-4">How it works</h2>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {STEPS.map((s, i) => (
            <div className="col" key={s.title}>
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
                <div className="mb-3">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                    style={{ width: 56, height: 56 }}
                  >
                    <i className={`bi bi-${s.icon} fs-3`} />
                  </span>
                </div>
                <h6 className="fw-bold">
                  {i + 1}. {s.title}
                </h6>
                <p className="text-muted small mb-0">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr />
      <PartnerSection />
      <div className="py-4" />
    </>
  );
};

export default Home;
