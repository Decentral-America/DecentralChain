/**
 * useRouteStateTracking Hook
 * Tracks user's navigation within main sections (wallet, dex, settings)
 * and saves the last active route for restoration on next login.
 *
 * Matches Angular: User.applyState() lines 601-604
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface UseRouteStateTrackingOptions {
  /**
   * Enable route tracking (typically enabled when user is authenticated)
   */
  enabled?: boolean;
}

/**
 * Hook to track and save route changes for authenticated users
 * Automatically saves the last visited sub-route within wallet, dex, and settings sections
 *
 * @param options - Configuration options
 *
 * @example
 * // In a layout component or main app wrapper:
 * function MainLayout() {
 *   const { isAuthenticated } = useAuth();
 *   useRouteStateTracking({ enabled: isAuthenticated });
 *
 *   return <Outlet />;
 * }
 */
export function useRouteStateTracking(options: UseRouteStateTrackingOptions = {}) {
  const { enabled = true } = options;
  const location = useLocation();
  const { saveLastRoute, isAuthenticated } = useAuth();
  const lastSavedPath = useRef<string>('');

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const path = location.pathname;

    // Only save if the path has actually changed
    if (path === lastSavedPath.current) return;

    // Determine which main section we're in and save the route
    if (path.startsWith('/desktop/wallet')) {
      saveLastRoute('wallet', path);
      lastSavedPath.current = path;
    } else if (path.startsWith('/desktop/dex')) {
      saveLastRoute('dex', path);
      lastSavedPath.current = path;
    } else if (path.startsWith('/desktop/settings')) {
      saveLastRoute('settings', path);
      lastSavedPath.current = path;
    }

    // Optionally log for debugging (only when path changes)
    if (path !== lastSavedPath.current) {
      logger.debug('[RouteTracking] Saved route:', path);
    }
  }, [location.pathname, enabled, isAuthenticated, saveLastRoute]);
  // Note: saveLastRoute intentionally omitted from deps to prevent infinite loop
}
