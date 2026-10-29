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
    { to: '/qr', label: 'Scan Table QR', icon: 'qr-code-scan' },
    { to: '/about', label: 'About', icon: 'info-circle' },
  ],
  customer: [
    { to: '/', label: 'Home', icon: 'house' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
    { to: '/qr', label: 'Scan Table QR', icon: 'qr-code-scan' },
    { to: '/orders', label: 'My Orders', icon: 'receipt' },
  ],
  counter: [
    { to: '/counter', label: 'Counter Console', icon: 'display' },
    { to: '/cafes', label: 'Cafes', icon: 'shop' },
    { to: '/qr', label: 'Scan Table QR', icon: 'qr-code-scan' },
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

  const closeNav = () => {
    const nav = document.getElementById('fpcNav');
    if (nav && nav.classList.contains('show')) {
      nav.classList.remove('show');
    }
  };

  const links = isGuest
    ? [
        { to: '/qr', label: 'Scan Table QR', icon: 'qr-code-scan' },
        { to: '/orders', label: 'My orders', icon: 'receipt' },
      ]
    : LINKS_BY_ROLE[role ?? 'guest'] ?? LINKS_BY_ROLE.guest;
  const showCart = !role || role === 'customer';

  return (
    <header id="Home" className="p-0 sticky-top shadow-2xs" style={{ zIndex: 1030 }}>
      <nav
        className="navbar p-0 navbar-expand-lg bg-body-tertiary"
        style={{ backgroundColor: 'antiquewhite', borderBottom: '1px solid rgba(139, 69, 19, 0.12)' }}
      >
        <div className="container-fluid px-2 px-md-4 py-1" style={{ backgroundColor: 'antiquewhite' }}>
          <div className="d-flex align-items-center">
            <Link className="navbar-brand me-1 me-sm-2 d-flex align-items-center" to="/" onClick={closeNav}>
              <img
                src={logoImg}
                alt="Front Page Cafe Logo"
                width="54"
                height="54"
                className="d-inline-block rounded-circle shadow-2xs"
                style={{ objectFit: 'contain' }}
              />
              <span
                className="fs-3 fw-bold ms-2 d-none d-sm-inline"
                style={{ color: '#2c1810', fontFamily: 'Bellota, cursive, sans-serif' }}
              >
                Front Page Cafe
              </span>
            </Link>
          </div>

          {/* Quick Header Actions: Cart, User/Auth & Hamburger toggler */}
          <div className="d-flex align-items-center gap-1 gap-sm-2 order-lg-last ms-auto">
            {user && <NotificationBell />}

            {user ? (
              <div className="nav-item position-relative" ref={dropdownRef}>
                <button
                  className="btn border-0 p-1 d-flex align-items-center"
                  onClick={() => setDropdownOpen((c) => !c)}
                  aria-expanded={dropdownOpen}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="rounded-circle shadow-sm"
                      style={{ width: 36, height: 36, objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-2xs"
                      style={{ width: 36, height: 36 }}
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
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow border-0 rounded-4"
                      style={{ right: 0, zIndex: 1050, marginTop: 10, minWidth: 200 }}
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
                            <i className="bi bi-person me-2 text-warning" /> Profile
                          </Link>
                        </li>
                      )}
                      {role === 'customer' && (
                        <li>
                          <Link className="dropdown-item py-2" to="/orders" onClick={() => setDropdownOpen(false)}>
                            <i className="bi bi-receipt me-2 text-warning" /> My Orders
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
                            <i className="bi bi-speedometer2 me-2 text-warning" /> Dashboard
                          </Link>
                        </li>
                      )}
                      {!isGuest && (
                        <li>
                          <Link className="dropdown-item py-2" to="/settings" onClick={() => setDropdownOpen(false)}>
                            <i className="bi bi-gear me-2 text-secondary" /> Settings
                          </Link>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider my-1" />
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
              <div className="d-flex align-items-center gap-1">
                <Link className="btn btn-outline-dark btn-sm px-2 px-sm-3 fw-semibold rounded-pill" to="/login">
                  Log In
                </Link>
                <Link className="btn btn-primary btn-sm px-2 px-sm-3 fw-semibold rounded-pill" to="/signup">
                  Sign Up
                </Link>
              </div>
            )}

            {showCart && (
              <Link to="/cart" className="btn btn-light bg-white border position-relative rounded-pill px-3 py-1 shadow-2xs ms-1" title="View Cart">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="d-flex align-items-center gap-1">
                  <i className="bi bi-cart3 fs-5 text-dark" />
                  <span className="small fw-bold d-none d-sm-inline">Cart</span>
                  <AnimatePresence>
                    {itemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="badge rounded-pill bg-danger ms-1"
                      >
                        {itemCount}
                        <span className="visually-hidden">items in cart</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            )}

            {/* Hamburger Button for Mobile */}
            <button
              className="navbar-toggler border-0 shadow-none p-1 ms-1 d-lg-none"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#fpcNav"
              aria-controls="fpcNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>
          </div>

          {/* Collapsible Nav Links */}
          <div className="collapse navbar-collapse" id="fpcNav">
            <ul className="navbar-nav mx-auto my-2 my-lg-0 py-2 py-lg-0 d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-1 gap-lg-2">
              {links.map((link) => (
                <li key={link.to} className="nav-item">
                  <Link
                    className="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-medium text-dark"
                    to={link.to}
                    onClick={closeNav}
                  >
                    <i className={`bi bi-${link.icon} fs-5 text-warning`} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
