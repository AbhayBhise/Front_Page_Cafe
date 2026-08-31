import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';
import { VegDot } from '../components/ui';
import BackButton from '../components/BackButton';

const Cart = () => {
  const { lines, subtotal, cafeName, setQuantity, remove } = useCartStore();
  const { status } = useAuth();
  const navigate = useNavigate();

  const proceed = () => {
    if (status !== 'authed') {
      toast('Please sign in to place your order');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (lines.length === 0) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
        <i className="bi bi-cart-x display-3 text-muted opacity-25 d-block mb-3" />
        <h3 className="mb-3">Your cart is empty</h3>
        <Link to="/cafes" className="btn btn-primary">
          Browse cafes
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ minHeight: '60vh' }}>
      <BackButton fallbackPath="/cafes" />
      <h2 className="fw-bold mb-1">Your cart</h2>
      {cafeName && <p className="text-muted">Ordering from <strong>{cafeName}</strong></p>}

      <div className="row g-4">
        <div className="col-lg-8">
          <ul className="list-group shadow-sm rounded-4 overflow-hidden">
            <AnimatePresence>
              {lines.map((l) => (
                <motion.li
                  key={l.menuItemId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="list-group-item d-flex flex-wrap align-items-center gap-3 p-3"
                >
                  <img
                    src={l.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'}
                    alt={l.name}
                    className="rounded"
                    style={{ width: 56, height: 56, objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <VegDot isVeg={l.isVeg} />
                      <span className="fw-semibold">{l.name}</span>
                    </div>
                    <span className="text-muted small">{money(l.price)} each</span>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-secondary" onClick={() => setQuantity(l.menuItemId, l.quantity - 1)}>
                      −
                    </button>
                    <span className="btn btn-outline-secondary disabled text-dark">{l.quantity}</span>
                    <button className="btn btn-outline-secondary" onClick={() => setQuantity(l.menuItemId, l.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <span className="fw-bold" style={{ width: 90, textAlign: 'right' }}>
                    {money(l.price * l.quantity)}
                  </span>
                  <button className="btn btn-sm btn-link text-danger" onClick={() => remove(l.menuItemId)} aria-label="Remove">
                    <i className="bi bi-trash" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted small">
                <span>Taxes</span>
                <span>calculated at checkout</span>
              </div>
              <hr />
              <button className="btn btn-primary w-100 py-2 fw-bold" onClick={proceed}>
                Proceed to checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
