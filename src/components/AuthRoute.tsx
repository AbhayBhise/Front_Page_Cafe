import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHome } from './ProtectedRoute';
import { Spinner } from './ui';

const AuthRoute = () => {
  const { status, role } = useAuth();
  if (status === 'loading') return <Spinner label="Checking your session…" />;
  if (status === 'authed') return <Navigate to={roleHome(role)} replace />;
  return <Outlet />;
};

export default AuthRoute;
