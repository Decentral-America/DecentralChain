/**
 * Application Router Configuration
 * Defines all routes using React Router v7 createBrowserRouter.
 *
 * Code-splitting strategy:
 *   - '/'              → LandingPage lazy (no auth context required)
 *   - All other routes → wrapped in AuthBoundaryLayout (lazy), which mounts
 *                        LedgerProvider + AuthProvider + SettingsProvider only when
 *                        the user navigates away from the landing page.
 *   - '/desktop/*'     → ProtectedRoute (lazy) + MainLayout (lazy)
 *
 * index.html provides an HTML/CSS loading shell so the user sees a spinner
 * before React mounts and the LandingPage chunk loads.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ErrorPage } from '@/pages/ErrorPage';
import { dexRoutes } from './dexRoutes';
import { settingsRoutes } from './settingsRoutes';
import { walletRoutes } from './walletRoutes';

/**
 * Application router. See JSDoc above for full code-splitting strategy.
 */
export const router = createBrowserRouter([
  {
    children: [
      {
        // '/' is lazy: LandingPage chunk (~400 kB) only loads for the landing route.
        // index.html contains an inline shell so the user sees content before JS parses.
        lazy: () => import('@/pages/LandingPage').then((m) => ({ Component: m.default })),
        path: '/',
      },
      {
        // AuthBoundaryLayout — lazy intermediate route that mounts
        // LedgerProvider + AuthProvider + SettingsProvider + GlobalKeyboardShortcuts.
        // Only loaded when the user navigates away from '/'.
        // Defers ~315 kB of auth/ledger/settings context from the critical path.
        children: [
          {
            lazy: () => import('@/pages/Welcome').then((m) => ({ Component: m.Welcome })),
            path: '/welcome',
          },
          {
            lazy: () => import('@/pages/SignUp').then((m) => ({ Component: m.SignUp })),
            path: '/signup',
          },
          {
            lazy: () => import('@/pages/SignUp').then((m) => ({ Component: m.SignUp })),
            path: '/create-account',
          },
          {
            lazy: () => import('@/pages/SignIn').then((m) => ({ Component: m.SignIn })),
            path: '/signin',
          },
          {
            lazy: () => import('@/pages/SignIn').then((m) => ({ Component: m.SignIn })),
            path: '/sign-in',
          },
          {
            lazy: () =>
              import('@/pages/ImportAccountPage').then((m) => ({
                Component: m.ImportAccountPage,
              })),
            path: '/import-account',
          },
          {
            lazy: () => import('@/pages/SaveSeed').then((m) => ({ Component: m.SaveSeedPage })),
            path: '/save-seed',
          },
          {
            lazy: () =>
              import('@/pages/RestoreFromBackup').then((m) => ({
                Component: m.RestoreFromBackupPage,
              })),
            path: '/restore-backup',
          },
          {
            lazy: () => import('@/pages/ImportLedger').then((m) => ({ Component: m.ImportLedger })),
            path: '/import/ledger',
          },
          {
            children: [
              {
                // MainLayout is lazy — defers ~25 MUI icon imports + the full sidebar
                // from the initial bundle. Only loaded when user reaches /desktop/*.
                children: [
                  {
                    element: <Navigate to="/desktop/wallet" replace />,
                    index: true,
                  },
                  walletRoutes,
                  dexRoutes,
                  settingsRoutes,
                  {
                    lazy: () => import('@/pages/Bridge').then((m) => ({ Component: m.Bridge })),
                    path: 'bridge',
                  },
                  {
                    lazy: () => import('@/pages/Markets').then((m) => ({ Component: m.Markets })),
                    path: 'markets',
                  },
                  {
                    lazy: () =>
                      import('@/pages/OrderBook').then((m) => ({ Component: m.OrderBook })),
                    path: 'orderbook',
                  },
                  {
                    lazy: () =>
                      import('@/pages/Analytics').then((m) => ({ Component: m.Analytics })),
                    path: 'analytics',
                  },
                  {
                    lazy: () => import('@/pages/Messages').then((m) => ({ Component: m.Messages })),
                    path: 'messages',
                  },
                  {
                    lazy: () =>
                      import('@/pages/CreateToken').then((m) => ({ Component: m.CreateToken })),
                    path: 'create-token',
                  },
                ],
                lazy: () =>
                  import('@/layouts/MainLayout').then((m) => ({ Component: m.MainLayout })),
              },
            ],
            // ProtectedRoute is lazy: it imports useAuth → AuthContext → data-service.
            // Deferring it keeps the entire auth/data chain off the critical path.
            lazy: () =>
              import('@/components/layout/ProtectedRoute').then((m) => ({
                Component: m.ProtectedRoute,
              })),
            path: '/desktop',
          },
          {
            lazy: () =>
              import('@/pages/admin/DexPairAdmin').then((m) => ({ Component: m.DexPairAdmin })),
            path: '/dccadmin',
          },
        ],
        lazy: () =>
          import('@/layouts/AuthBoundaryLayout').then((m) => ({
            Component: m.AuthBoundaryLayout,
          })),
      },
      {
        element: <Navigate to="/" replace />,
        path: '*',
      },
    ],
    element: <RootLayout />,
    errorElement: <ErrorPage />,
  },
]);
