import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';
import type { Role } from '../types';

export const roleHome = (role: Role | null): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/owner';
    case 'counter':
      return '/counter';
    default:
      return '/';
  }
};

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: Role[] }) => {
  const { status, role } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Checking your session…" />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
