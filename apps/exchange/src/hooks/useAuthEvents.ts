/**
 * Auth Events Hook
 * Listen to authentication events (login/logout)
 * Matches Angular: loginSignal, logoutSignal
 */
import { useEffect } from 'react';
import { type User } from '@/types/auth';

/**
 * Hook to listen to authentication events
 * @param onLogin - Callback when login event fires
 * @param onLogout - Callback when logout event fires
 *
 * Example usage:
 * ```tsx
 * useAuthEvents(
 *   (user) => {
 *     logger.debug('User logged in:', user.name);
 *     startPolling();
 *   },
 *   () => {
 *     logger.debug('User logged out');
 *     stopPolling();
 *   }
 * );
 * ```
 */
export const useAuthEvents = (onLogin?: (user: User) => void, onLogout?: () => void) => {
  useEffect(() => {
    const handleLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: User }>;
      if (onLogin && customEvent.detail?.user) {
        onLogin(customEvent.detail.user);
      }
    };

    const handleLogout = () => {
      if (onLogout) {
        onLogout();
      }
    };

    // Add event listeners
    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [onLogin, onLogout]);
};
