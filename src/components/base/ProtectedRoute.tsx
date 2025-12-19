import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" replace />;
  }

  // If specific roles are required, check user's role
  if (allowedRoles && allowedRoles.length > 0) {
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'citizen';
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to home if user doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
