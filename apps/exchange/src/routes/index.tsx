/**
 * Application Router Configuration
 * Defines all routes using React Router v7 createBrowserRouter with route-level
 * code splitting. Auth pages (LandingPage, SignUp, SignIn, ImportAccountPage, SaveSeedPage)
 * are eagerly loaded. All other pages use the `lazy` property for code splitting.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout';
import { MainLayout } from '@/layouts/MainLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { ErrorPage } from '@/pages/ErrorPage';
// Auth pages — eager (critical path, user lands here first)
import { ImportAccountPage } from '@/pages/ImportAccountPage';
import LandingPage from '@/pages/LandingPage';
import { SaveSeedPage } from '@/pages/SaveSeed';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { dexRoutes } from './dexRoutes';
import { settingsRoutes } from './settingsRoutes';
import { walletRoutes } from './walletRoutes';

/**
 * Application router with nested routes and route-level code splitting.
 * Auth pages are eager; all other pages lazy-loaded via React Router v7 `lazy`.
 */
export const router = createBrowserRouter([
  {
    children: [
      {
        element: <LandingPage />,
        path: '/',
      },
      {
        lazy: () => import('@/pages/Welcome').then((m) => ({ Component: m.Welcome })),
        path: '/welcome',
      },
      {
        element: <SignUp />,
        path: '/signup',
      },
      {
        element: <SignUp />,
        path: '/create-account',
      },
      {
        element: <SignIn />,
        path: '/signin',
      },
      {
        element: <SignIn />,
        path: '/sign-in',
      },
      {
        element: <ImportAccountPage />,
        path: '/import-account',
      },
      {
        element: <SaveSeedPage />,
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
            children: [
              {
                element: <Navigate to="/desktop/wallet" replace />,
                index: true,
              },
              walletRoutes,
              dexRoutes,
              settingsRoutes,
              {
                lazy: () => import('@/pages/Swap').then((m) => ({ Component: m.Swap })),
                path: 'swap',
              },
              {
                lazy: () => import('@/pages/Bridge').then((m) => ({ Component: m.Bridge })),
                path: 'bridge',
              },
              {
                lazy: () => import('@/pages/Markets').then((m) => ({ Component: m.Markets })),
                path: 'markets',
              },
              {
                lazy: () => import('@/pages/OrderBook').then((m) => ({ Component: m.OrderBook })),
                path: 'orderbook',
              },
              {
                lazy: () => import('@/pages/Analytics').then((m) => ({ Component: m.Analytics })),
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
            element: <MainLayout />,
          },
        ],
        element: <ProtectedRoute />,
        path: '/desktop',
      },
      {
        lazy: () =>
          import('@/pages/admin/DexPairAdmin').then((m) => ({ Component: m.DexPairAdmin })),
        path: '/dccadmin',
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
