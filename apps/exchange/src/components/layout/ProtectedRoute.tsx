/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication
 * Redirects to welcome page if user is not authenticated
 */

import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  redirectTo?: string;
  children?: React.ReactNode;
}

/**
 * Protected route component that checks authentication
 * Waits for session restoration before making redirect decisions
 * @param redirectTo - Path to redirect if not authenticated (default: '/')
 * @param children - Optional children to render instead of Outlet
 */
export const ProtectedRoute = ({ redirectTo = '/', children }: ProtectedRouteProps) => {
  const { user, isAuthenticated, sessionRestored } = useAuth();

  // Wait for session restoration before deciding — prevents flash redirect
  if (!sessionRestored) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to welcome page if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};
