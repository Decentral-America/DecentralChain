/**
 * AuthBoundaryLayout
 *
 * Lazy-loaded intermediate layout that gates auth-related context providers.
 * Only mounted when the user navigates away from the public landing page ('/').
 *
 * This defers three heavy providers from the critical-path bundle:
 *   - LedgerProvider  (~35 kB)
 *   - AuthProvider    (~262 kB — data-service + multiAccount + signature-adapter)
 *   - SettingsProvider (~18 kB)
 *
 * Provider order must match the original App.tsx hierarchy:
 *   LedgerProvider → AuthProvider → SettingsProvider
 *
 * GlobalKeyboardShortcuts is co-located here because it uses useAuth() and
 * is only meaningful when the user has (or might have) an active session.
 *
 * initializeDataService() is called at module level so it runs synchronously
 * the first time this chunk is imported — before any provider mounts.
 */
import { Outlet } from 'react-router';
import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts';
import { initializeDataService } from '@/config/dataServiceConfig';
import { AuthProvider } from '@/contexts/AuthContext';
import { LedgerProvider } from '@/contexts/LedgerContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

// Configure data-service when this chunk first loads.
// Idempotent — safe to call multiple times if the module is re-evaluated.
initializeDataService();

export const AuthBoundaryLayout = () => (
  <LedgerProvider>
    <AuthProvider>
      <SettingsProvider>
        <GlobalKeyboardShortcuts />
        <Outlet />
      </SettingsProvider>
    </AuthProvider>
  </LedgerProvider>
);
