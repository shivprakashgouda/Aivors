import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null; // could show a spinner
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { loading, isAuthenticated, isAdmin, user } = useAuth();
  
  console.log('🔒 AdminRoute check:', {
    loading,
    isAuthenticated,
    isAdmin,
    userRole: user?.role,
  });
  
  if (loading) {
    console.log('⏳ AdminRoute: Still loading...');
    return null;
  }
  
  if (!isAuthenticated || !isAdmin) {
    console.log('❌ AdminRoute: Access denied, redirecting to /admin/login');
    return <Navigate to="/admin/login" replace />;
  }
  
  console.log('✅ AdminRoute: Access granted');
  return children;
};

export default PrivateRoute;
