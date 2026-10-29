import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import NotificationBell from './NotificationBell';
import logoImg from '../assets/logo.png';

interface NavLink {
  to: string;
  label: string;
  icon: string;
}

const LINKS_BY_ROLE: Record<string, NavLink[]> = {
  guest: [
    { to: '/', label: 'Home', icon: 'house' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
    { to: '/about', label: 'About', icon: 'info-circle' },
  ],
  customer: [
    { to: '/', label: 'Home', icon: 'house' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
    { to: '/orders', label: 'My Orders', icon: 'receipt' },
  ],
  counter: [
    { to: '/counter', label: 'Counter Console', icon: 'display' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
  ],
  owner: [
    { to: '/owner', label: 'Dashboard', icon: 'speedometer2' },
    { to: '/owner/menu', label: 'Menu', icon: 'card-list' },
    { to: '/owner/tables', label: 'Tables', icon: 'qr-code' },
    { to: '/owner/staff', label: 'Staff', icon: 'people' },
    { to: '/owner/analytics', label: 'Analytics', icon: 'graph-up' },
  ],
  admin: [
    { to: '/admin', label: 'Admin', icon: 'shield-lock' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
  ],
};

const Navbar = () => {
  const { user, role, logout, isGuest, guestContext } = useAuth();
  const itemCount = useCartStore((s) => s.itemCount);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => event.key === 'Escape' && setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const links = isGuest
    ? [{ to: '/orders', label: 'My orders', icon: 'receipt' }]
    : LINKS_BY_ROLE[role ?? 'guest'] ?? LINKS_BY_ROLE.guest;
  const showCart = !role || role === 'customer';

  return (
    <header id="Home" className="p-0">
      <nav
        className="navbar p-0 navbar-expand-lg bg-body-tertiary mb-sm-3 mb-3"
        style={{ backgroundColor: 'antiquewhite' }}
      >
        <div className="container-fluid" style={{ backgroundColor: 'antiquewhite' }}>
          <Link className="navbar-brand mx-2" to="/">
            <img src={logoImg} alt="Front Page Cafe Logo" width="90" className="d-inline-block" />
          </Link>
          <Link to="/" className="navbar-brand fs-2 mx-1 d-none d-sm-inline">
            Front Page Cafe
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#fpcNav"
            aria-controls="fpcNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="fpcNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 d-flex flex-row flex-wrap align-items-center">
              {links.map((link) => (
                <li
                  key={link.to}
                  className="nav-item d-flex flex-column justify-content-center align-items-center text-center mx-2"
                >
                  <i className={`bi bi-${link.icon} m-0 fs-4`} />
                  <Link className="nav-link m-0" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-1">
              {user && <NotificationBell />}

              {user ? (
                <div className="nav-item position-relative" ref={dropdownRef}>
                  <button
                    className="btn border-0 d-flex align-items-center"
                    onClick={() => setDropdownOpen((c) => !c)}
                    aria-expanded={dropdownOpen}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Profile"
                        className="rounded-circle shadow-sm"
                        style={{ width: 35, height: 35, objectFit: 'cover' }}
                      />
                    ) : (
                      <span
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: 35, height: 35 }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="dropdown-menu dropdown-menu-end show position-absolute shadow"
                        style={{ right: 0, zIndex: 1050, marginTop: 10 }}
                      >
                        <li className="px-3 py-2 border-bottom">
                          <div className="fw-bold small">{isGuest ? 'Guest' : user.name}</div>
                          <div className="text-muted text-capitalize" style={{ fontSize: 12 }}>
                            {isGuest ? guestContext?.tableLabel ?? 'Quick dine' : role}
                          </div>
                        </li>
                        {!isGuest && (
                          <li>
                            <Link className="dropdown-item py-2" to="/profile" onClick={() => setDropdownOpen(false)}>
                              <i className="bi bi-person me-2" /> Profile
                            </Link>
                          </li>
                        )}
                        {role === 'customer' && (
                          <li>
                            <Link className="dropdown-item py-2" to="/orders" onClick={() => setDropdownOpen(false)}>
                              <i className="bi bi-receipt me-2" /> My Orders
                            </Link>
                          </li>
                        )}
                        {(role === 'owner' || role === 'admin') && (
                          <li>
                            <Link
                              className="dropdown-item py-2"
                              to={role === 'admin' ? '/admin' : '/owner'}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <i className="bi bi-speedometer2 me-2" /> Dashboard
                            </Link>
                          </li>
                        )}
                        {!isGuest && (
                          <li>
                            <Link className="dropdown-item py-2" to="/settings" onClick={() => setDropdownOpen(false)}>
                              <i className="bi bi-gear me-2" /> Settings
                            </Link>
                          </li>
                        )}
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li>
                          <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right me-2" /> {isGuest ? 'Finish visit' : 'Logout'}
                          </button>
                        </li>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link className="btn btn-outline-dark btn-sm mx-1" to="/login">
                    Log In
                  </Link>
                  <Link className="btn btn-primary btn-sm" to="/signup">
                    Sign Up
                  </Link>
                </>
              )}

              {showCart && (
                <Link to="/cart" className="btn position-relative" title="View Cart">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <i className="bi bi-cart-check fs-4" />
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        >
                          {itemCount}
                          <span className="visually-hidden">items in cart</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
