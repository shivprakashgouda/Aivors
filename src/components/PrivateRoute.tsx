import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null; // could show a spinner
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  if (loading) return null;
  return isAuthenticated && isAdmin ? children : <Navigate to="/admin/login" replace />;
};

export default PrivateRoute;
