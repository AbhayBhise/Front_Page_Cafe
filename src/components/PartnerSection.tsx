import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PartnerSection = () => {
  return (
    <section className="container my-5">
      <div className="row g-4">
        <div className="col-md-6">
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="card border-0 rounded-4 overflow-hidden shadow-sm position-relative text-white h-100"
            style={{
              minHeight: '220px',
              background: 'linear-gradient(rgba(44, 24, 16, 0.65), rgba(44, 24, 16, 0.85)), url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=900) center/cover no-repeat',
            }}
          >
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-warning text-dark mb-2 fw-semibold px-3 py-1">
                  For Cafe Owners
                </span>
                <h3 className="fw-bold mb-2">Partner Your Cafe With Us</h3>
                <p className="text-light small mb-3" style={{ maxWidth: '420px', opacity: 0.9 }}>
                  Empower your kitchen with smart table QR ordering, real-time counter consoles, and automated kitchen-load ETAs.
                </p>
              </div>
              <div>
                <Link
                  to="/signup"
                  className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill shadow-sm"
                >
                  <i className="bi bi-buildings me-2" />
                  List Your Cafe Today
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="col-md-6">
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="card border-0 rounded-4 overflow-hidden shadow-sm position-relative text-white h-100"
            style={{
              minHeight: '220px',
              background: 'linear-gradient(rgba(44, 24, 16, 0.65), rgba(44, 24, 16, 0.85)), url(https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=900) center/cover no-repeat',
            }}
          >
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-light text-dark mb-2 fw-semibold px-3 py-1">
                  Neighborhood Spots
                </span>
                <h3 className="fw-bold mb-2">Find Cafes Near You</h3>
                <p className="text-light small mb-3" style={{ maxWidth: '420px', opacity: 0.9 }}>
                  Discover cozy coffee havens, wood-fired ovens, and artisan roasters verified for quality and ambiance.
                </p>
              </div>
              <div>
                <Link
                  to="/cafes"
                  className="btn btn-light text-dark fw-bold px-4 py-2 rounded-pill shadow-sm"
                >
                  <i className="bi bi-geo-alt-fill me-2 text-danger" />
                  Explore All Locations
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;
