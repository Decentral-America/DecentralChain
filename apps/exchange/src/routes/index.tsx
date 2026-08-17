/**
 * Application Router Configuration
 * Defines all routes using React Router v7 createBrowserRouter.
 *
 * Code-splitting strategy:
 *   - '/'              → LandingPage lazy (no auth context required)
 *   - All other routes → wrapped in AuthBoundaryLayout (lazy), which mounts
 *                        LedgerProvider + AuthProvider + SettingsProvider only when
 *                        the user navigates away from the landing page.
 *   - '/desktop/*'     → ProtectedRoute (lazy) + ResponsiveAppLayout (lazy),
 *                        which renders MobileLayout or MainLayout by viewport
 *
 * index.html provides an HTML/CSS loading shell so the user sees a spinner
 * before React mounts and the LandingPage chunk loads.
 */
import { createBrowserRouter, Navigate } from 'react-router';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { ResponsiveScreen } from '@/layouts/ResponsiveScreen';
import { RootLayout } from '@/layouts/RootLayout';
import { ErrorPage } from '@/pages/ErrorPage';
import { dexRoutes } from './dexRoutes';
import { lazyPage } from './lazyPage';
import { settingsRoutes } from './settingsRoutes';
import { walletRoutes } from './walletRoutes';

// Peripheral desktop screens — deferred via `lazyPage`, reused as-is on
// mobile inside `MobilePageShell` for the chrome (header, gutters, rhythm).
const Bridge = lazyPage(() => import('@/pages/Bridge'), 'Bridge');
const Markets = lazyPage(() => import('@/pages/Markets'), 'Markets');
const OrderBook = lazyPage(() => import('@/pages/OrderBook'), 'OrderBook');
const Analytics = lazyPage(() => import('@/pages/Analytics'), 'Analytics');
const Messages = lazyPage(() => import('@/pages/Messages'), 'Messages');
const CreateToken = lazyPage(() => import('@/pages/CreateToken'), 'CreateToken');
const Swap = lazyPage(() => import('@/pages/Swap'), 'Swap');

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
            lazy: () => import('@/pages/ImportPage').then((m) => ({ Component: m.ImportPage })),
            path: '/import',
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
            lazy: () =>
              import('@/pages/CubensisConnectImportPage').then((m) => ({
                Component: m.CubensisConnectImportPage,
              })),
            path: '/import/cubensis-connect',
          },
          {
            children: [
              {
                // ResponsiveAppLayout is lazy — defers MainLayout's ~25 MUI icon
                // imports and MobileLayout's shell, loading only once the
                // user reaches /desktop/* and only the one the viewport needs.
                children: [
                  {
                    element: <Navigate to="/desktop/wallet" replace />,
                    index: true,
                  },
                  walletRoutes,
                  dexRoutes,
                  settingsRoutes,
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell title="Bridge" subtitle="Move assets across chains.">
                            <Bridge />
                          </MobilePageShell>
                        }
                        desktop={<Bridge />}
                      />
                    ),
                    path: 'bridge',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Markets"
                            subtitle="Price overview across markets."
                          >
                            <Markets />
                          </MobilePageShell>
                        }
                        desktop={<Markets />}
                      />
                    ),
                    path: 'markets',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Order book"
                            subtitle="Live order book and market depth."
                          >
                            <OrderBook />
                          </MobilePageShell>
                        }
                        desktop={<OrderBook />}
                      />
                    ),
                    path: 'orderbook',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Analytics"
                            subtitle="Activity and performance over time."
                          >
                            <Analytics />
                          </MobilePageShell>
                        }
                        desktop={<Analytics />}
                      />
                    ),
                    path: 'analytics',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Messages"
                            subtitle="Notifications and alerts from the network."
                          >
                            <Messages />
                          </MobilePageShell>
                        }
                        desktop={<Messages />}
                      />
                    ),
                    path: 'messages',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Create token"
                            subtitle="Issue a new asset on DecentralChain."
                          >
                            <CreateToken />
                          </MobilePageShell>
                        }
                        desktop={<CreateToken />}
                      />
                    ),
                    path: 'create-token',
                  },
                  {
                    element: (
                      <ResponsiveScreen
                        mobile={
                          <MobilePageShell
                            title="Swap"
                            subtitle="Exchange one asset for another at the best available rate."
                          >
                            <Swap />
                          </MobilePageShell>
                        }
                        desktop={<Swap />}
                      />
                    ),
                    path: 'swap',
                  },
                ],
                lazy: () =>
                  import('@/layouts/ResponsiveLayout').then((m) => ({
                    Component: m.ResponsiveAppLayout,
                  })),
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
          /*
           * Development-only preview of the mobile shell, ported from the
           * standalone exchange app. The mobile screens live behind
           * authentication, which needs a real encrypted session, so this
           * route makes them reachable while building and reviewing them.
           */
          ...(import.meta.env.DEV
            ? [
                {
                  children: [
                    {
                      index: true,
                      lazy: () =>
                        import('@/pages/mobile/MobileHome').then((m) => ({
                          Component: m.MobileHome,
                        })),
                    },
                    {
                      lazy: () =>
                        import('@/pages/mobile/MobileHome').then((m) => ({
                          Component: m.MobileHome,
                        })),
                      path: 'home',
                    },
                    {
                      lazy: () =>
                        import('@/pages/mobile/MobilePortfolio').then((m) => ({
                          Component: m.MobilePortfolio,
                        })),
                      path: 'portfolio',
                    },
                    {
                      lazy: () =>
                        import('@/pages/mobile/MobileMarkets').then((m) => ({
                          Component: m.MobileMarkets,
                        })),
                      path: 'markets',
                    },
                    {
                      lazy: () =>
                        import('@/pages/mobile/MobileAccount').then((m) => ({
                          Component: m.MobileAccount,
                        })),
                      path: 'account',
                    },
                  ],
                  lazy: () =>
                    import('@/layouts/MobileLayout').then((m) => ({ Component: m.MobileLayout })),
                  path: '/mobile-preview',
                },
                // Onboarding is pre-authentication, so it renders without the shell.
                {
                  lazy: () =>
                    import('@/pages/mobile/MobileWelcome').then((m) => ({
                      Component: m.MobileWelcome,
                    })),
                  path: '/mobile-preview-welcome',
                },
              ]
            : []),
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
    // Suppress React Router v7 "No HydrateFallback" warning for CSR apps.
    // The warning fires when router.state.initialized is false (initial render
    // before lazy routes resolve). Providing any component — even a no-op —
    // satisfies the check without showing any visible loading indicator.
    HydrateFallback: () => null,
  },
]);
