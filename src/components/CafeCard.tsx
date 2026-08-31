import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Cafe } from '../types';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800';

const CafeCard = ({ cafe }: { cafe: Cafe }) => (
  <motion.div whileHover={{ y: -4 }} className="h-100">
    <Link to={`/cafes/${cafe.slug}`} className="text-decoration-none text-reset">
      <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
        <div style={{ height: 150, background: '#f6efe4' }}>
          <img
            src={cafe.bannerUrl || FALLBACK_BANNER}
            alt={cafe.name}
            className="w-100 h-100"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
            }}
          />
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <h5 className="fw-bold mb-1">{cafe.name}</h5>
            <span className={`badge ${cafe.isOpen ? 'bg-success' : 'bg-secondary'}`}>
              {cafe.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-muted small mb-2">
            <i className="bi bi-geo-alt me-1" />
            {[cafe.city, cafe.state].filter(Boolean).join(', ') || 'Location coming soon'}
          </p>
          {cafe.description && (
            <p className="text-muted small mb-0" style={{ minHeight: 40 }}>
              {cafe.description.slice(0, 90)}
              {cafe.description.length > 90 ? '…' : ''}
            </p>
          )}
          {typeof cafe._count?.menuItems === 'number' && (
            <p className="small text-primary mb-0 mt-2 fw-semibold">
              {cafe._count.menuItems} items on the menu
            </p>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
);

export default CafeCard;
