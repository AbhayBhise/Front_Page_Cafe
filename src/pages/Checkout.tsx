import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { cafeService } from '../services/cafeService';
import { orderService } from '../services/orderService';
import { money } from '../lib/format';
import { Spinner } from '../components/ui';
import BackButton from '../components/BackButton';
import type { Cafe, FulfillmentType, PaymentMethod } from '../types';

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'upi', label: 'UPI', icon: 'phone' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet2' },
  { id: 'cash', label: 'Pay at counter', icon: 'cash-coin' },
];

interface TableCtx {
  cafeId: string;
  cafeSlug: string;
  tableId: string;
  tableLabel: string;
}

const readTableCtx = (): TableCtx | null => {
  try {
    const raw = sessionStorage.getItem('fpc.tableCtx');
    return raw ? (JSON.parse(raw) as TableCtx) : null;
  } catch {
    return null;
  }
};

const Checkout = () => {
  const { lines, subtotal, cafeId: cartCafeId, cafeName, clear } = useCartStore();
  const { user, isGuest, guestContext } = useAuth();
  const navigate = useNavigate();

  const tableCtx = useMemo(() => guestContext ?? readTableCtx(), [guestContext]);
  const dineInAtTable = Boolean(isGuest || tableCtx);
  // for guests the cafe is fixed by the token; otherwise use the cart's cafe
  const effectiveCafeId = isGuest ? guestContext?.cafeId : tableCtx?.cafeId ?? cartCafeId;

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const placedRef = useRef(false);

  const [fulfillment, setFulfillment] = useState<FulfillmentType>(dineInAtTable ? 'dine_in' : 'takeaway');
  const [tableNumber, setTableNumber] = useState(tableCtx?.tableLabel ?? '');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(dineInAtTable ? 'cash' : 'card');
  const [payToken, setPayToken] = useState('');
  const cleanName = user && !user.name.startsWith('Guest') ? user.name : '';
  const [name, setName] = useState(cleanName);
  const [phone, setPhone] = useState(user?.phone ?? '');

  useEffect(() => {
    if (placedRef.current) return;
    if (!effectiveCafeId || lines.length === 0) {
      navigate('/cart', { replace: true });
      return;
    }
    cafeService
      .get(effectiveCafeId)
      .then(setCafe)
      .catch(() => toast.error('Could not load cafe details'))
      .finally(() => setLoading(false));
  }, [effectiveCafeId, lines.length, navigate]);

  if (loading) return <Spinner label="Preparing checkout…" />;
  if (!cafe) return null;

  const taxAmount = Number(((subtotal * cafe.taxRate) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  const placeOrder = async () => {
    if (!cafe.isOpen) {
      toast.error('This cafe just closed — please try again later');
      return;
    }
    if (fulfillment === 'dine_in' && !tableNumber.trim() && !isGuest) {
      toast.error('Enter your table number for dine-in');
      return;
    }
    if (dineInAtTable && (!name.trim() || !phone.trim())) {
      toast.error('Add your name and phone number');
      return;
    }
    setPlacing(true);
    placedRef.current = true;
    try {
      const res = await orderService.place({
        cafeId: isGuest ? undefined : effectiveCafeId ?? undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
        fulfillmentType: fulfillment,
        tableNumber:
          fulfillment === 'dine_in' && !isGuest
            ? tableNumber.trim() || tableCtx?.tableLabel || undefined
            : undefined,
        notes: notes.trim() || undefined,
        customerName: name.trim() || user?.name || undefined,
        customerPhone: phone.trim() || user?.phone || undefined,
        payment: { method, token: method === 'cash' ? undefined : payToken.trim() || 'tok_ok' },
      });
      toast.success('Order placed!');
      navigate(`/orders/${res.data.id}`, { replace: true });
      clear();
    } catch (e) {
      placedRef.current = false;
      toast.error(e instanceof Error ? e.message : 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <BackButton fallbackPath="/cart" />
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h3 className="fw-bold text-center mb-1">Checkout · {cafeName || cafe.name}</h3>
              {dineInAtTable && (
                <p className="text-center text-muted mb-4">
                  <i className="bi bi-geo-alt-fill me-1" />
                  Dine-in · {tableCtx?.tableLabel ?? (tableNumber || 'your table')}
                </p>
              )}
              <div className="row g-4">
                <div className="col-md-6 border-end pe-md-4">
                  <h6 className="fw-bold mb-3">Your order</h6>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {lines.map((l) => (
                      <div key={l.menuItemId} className="d-flex justify-content-between small mb-2">
                        <span>
                          {l.quantity} × {l.name}
                        </span>
                        <span>{money(l.price * l.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Tax ({cafe.taxRate}%)</span>
                    <span>{money(taxAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                    <span>Total</span>
                    <span className="text-primary">{money(total)}</span>
                  </div>
                </div>

                <div className="col-md-6 ps-md-4">
                  {dineInAtTable ? (
                    <>
                      <h6 className="fw-bold mb-2">Your details</h6>
                      <input
                        className="form-control form-control-sm mb-2"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <input
                        className="form-control form-control-sm mb-3"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <h6 className="fw-bold mb-3">Fulfilment</h6>
                      <div className="btn-group w-100 mb-3">
                        <button
                          className={`btn btn-sm ${fulfillment === 'takeaway' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setFulfillment('takeaway')}
                        >
                          <i className="bi bi-bag me-1" /> Takeaway
                        </button>
                        <button
                          className={`btn btn-sm ${fulfillment === 'dine_in' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setFulfillment('dine_in')}
                        >
                          <i className="bi bi-cup-hot me-1" /> Dine-in
                        </button>
                      </div>
                      {fulfillment === 'dine_in' && (
                        <input
                          className="form-control form-control-sm mb-3"
                          placeholder="Table number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                        />
                      )}
                    </>
                  )}

                  <h6 className="fw-bold mb-2">Payment</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {METHODS.map((m) => (
                      <button
                        key={m.id}
                        className={`btn btn-sm ${method === m.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setMethod(m.id)}
                      >
                        <i className={`bi bi-${m.icon} me-1`} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {method !== 'cash' && (
                    <input
                      className="form-control form-control-sm mb-3"
                      placeholder={method === 'upi' ? 'name@upi (simulated)' : 'Card number (simulated)'}
                      value={payToken}
                      onChange={(e) => setPayToken(e.target.value)}
                    />
                  )}

                  <textarea
                    className="form-control form-control-sm mb-3"
                    rows={2}
                    placeholder="Notes for the kitchen (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <button className="btn btn-primary w-100 py-2 fw-bold" disabled={placing} onClick={placeOrder}>
                    {placing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" /> Processing…
                      </>
                    ) : method === 'cash' ? (
                      `Place order · ${money(total)}`
                    ) : (
                      `Pay ${money(total)}`
                    )}
                  </button>
                  <p className="text-center text-muted small mt-2 mb-0">
                    <i className="bi bi-shield-check me-1" /> Simulated gateway · a value ending in “fail” is declined
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
