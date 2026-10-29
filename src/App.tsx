import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';
import { Spinner } from './components/ui';

// Public + customer pages — loaded eagerly (small, on the hot path)
import Home from './pages/Home';
import About from './pages/About';
import CafeList from './pages/CafeList';
import CafeMenu from './pages/CafeMenu';
import TableLanding from './pages/TableLanding';
import QrScanner from './pages/QrScanner';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Settings from './pages/Settings';

// Staff dashboards — code-split (never needed by diners)
const CounterConsole = lazy(() => import('./pages/counter/CounterConsole'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const MenuManagement = lazy(() => import('./pages/owner/MenuManagement'));
const StaffManagement = lazy(() => import('./pages/owner/StaffManagement'));
const Tables = lazy(() => import('./pages/owner/Tables'));
const OwnerAnalytics = lazy(() => import('./pages/owner/OwnerAnalytics'));
const OwnerActivity = lazy(() => import('./pages/owner/OwnerActivity'));
const CafeSettings = lazy(() => import('./pages/owner/CafeSettings'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={<Spinner label="Loading…" />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="cafes" element={<CafeList />} />
              <Route path="cafes/:slug" element={<CafeMenu />} />
              <Route path="qr" element={<QrScanner />} />
              <Route path="scan" element={<Navigate to="/qr" replace />} />
              <Route path="t/:cafeSlug/:tableCode" element={<TableLanding />} />
              <Route path="about" element={<About />} />
              <Route path="cart" element={<Cart />} />

              {/* legacy redirects */}
              <Route path="menu" element={<Navigate to="/cafes" replace />} />
              <Route path="live-demo" element={<Navigate to="/cafes" replace />} />
              <Route path="cafe/:slug/menu" element={<Navigate to="/cafes" replace />} />
              <Route path="cafe-dashboard" element={<Navigate to="/owner" replace />} />
              <Route path="admin-dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="menu-management" element={<Navigate to="/owner/menu" replace />} />
              <Route path="analytics" element={<Navigate to="/owner/analytics" replace />} />

              <Route element={<AuthRoute />}>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetails />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['counter']} />}>
                <Route path="counter" element={<CounterConsole />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
                <Route path="owner" element={<OwnerDashboard />} />
                <Route path="owner/menu" element={<MenuManagement />} />
                <Route path="owner/staff" element={<StaffManagement />} />
                <Route path="owner/tables" element={<Tables />} />
                <Route path="owner/analytics" element={<OwnerAnalytics />} />
                <Route path="owner/activity" element={<OwnerActivity />} />
                <Route path="owner/settings" element={<CafeSettings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
