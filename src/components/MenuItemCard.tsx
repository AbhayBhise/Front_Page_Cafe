import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { money } from '../lib/format';
import { VegDot } from './ui';
import type { MenuItem } from '../types';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';

const MenuItemCard = ({
  item,
  cafeName,
  disabled,
}: {
  item: MenuItem;
  cafeName: string;
  disabled?: boolean;
}) => {
  const line = useCartStore((s) => s.lines.find((l) => l.menuItemId === item.id));
  const add = useCartStore((s) => s.add);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const qty = line?.quantity ?? 0;
  const hasOffer = !!item.compareAtPrice && item.compareAtPrice > item.price;
  const discountPct = hasOffer
    ? Math.round((1 - item.price / (item.compareAtPrice as number)) * 100)
    : 0;

  const handleAdd = () => {
    add(item, cafeName);
    toast.success(`${item.name} added`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden"
    >
      <div style={{ height: 170, overflow: 'hidden', background: '#f6efe4', position: 'relative' }}>
        <img
          src={item.imageUrl || FALLBACK_IMG}
          alt={item.name}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        {discountPct > 0 && (
          <span className="badge bg-danger position-absolute top-0 start-0 m-2">{discountPct}% OFF</span>
        )}
        {item.isFeatured && (
          <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2">
            <i className="bi bi-star-fill me-1" />Popular
          </span>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h6 className="fw-bold mb-1">{item.name}</h6>
          <VegDot isVeg={item.isVeg} />
        </div>
        {item.description && (
          <p className="text-muted small mb-2" style={{ minHeight: 32 }}>
            {item.description}
          </p>
        )}
        <div className="d-flex align-items-center justify-content-between mt-auto pt-2">
          <span className="fw-bold">
            {money(item.price)}
            {hasOffer && (
              <span className="text-muted text-decoration-line-through ms-2 small fw-normal">
                {money(item.compareAtPrice)}
              </span>
            )}
          </span>
          {!item.isAvailable || disabled ? (
            <span className="badge bg-secondary">{!item.isAvailable ? 'Unavailable' : 'Closed'}</span>
          ) : qty > 0 ? (
            <div className="btn-group btn-group-sm" role="group">
              <button className="btn btn-outline-danger" onClick={() => setQuantity(item.id, qty - 1)}>
                −
              </button>
              <span className="btn btn-outline-secondary disabled text-dark">{qty}</span>
              <button className="btn btn-outline-success" onClick={() => setQuantity(item.id, qty + 1)}>
                +
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={handleAdd}>
              <i className="bi bi-cart-plus me-1" /> Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
