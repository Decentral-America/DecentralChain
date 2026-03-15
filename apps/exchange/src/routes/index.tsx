/**
 * Application Router Configuration
 * Defines all routes using React Router v6 createBrowserRouter
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout';
import { MainLayout } from '@/layouts/MainLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { Analytics } from '@/pages/Analytics';
// Admin pages (hidden routes)
import { DexPairAdmin } from '@/pages/admin/DexPairAdmin';
import { Bridge } from '@/pages/Bridge';
import { CreateToken } from '@/pages/CreateToken';
import { ImportAccountPage } from '@/pages/ImportAccountPage';
import { ImportLedger } from '@/pages/ImportLedger';
// Direct imports for auth pages (critical entry points)
import LandingPage from '@/pages/LandingPage';
// Additional pages
import { Markets } from '@/pages/Markets';
import { Messages } from '@/pages/Messages';
import { OrderBook } from '@/pages/OrderBook';
import { RestoreFromBackupPage } from '@/pages/RestoreFromBackup';
import { SaveSeedPage } from '@/pages/SaveSeed';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { Swap } from '@/pages/Swap';
import { Welcome } from '@/pages/Welcome';
import { dexRoutes } from './dexRoutes';
import { settingsRoutes } from './settingsRoutes';
import { walletRoutes } from './walletRoutes';

/**
 * Application router with nested routes
 * - / : Welcome page (landing with login/create/import options)
 * - /signup : New account creation page
 * - /signin : User authentication page
 *   - Future child routes:
 *     - /create : Create new account
 *     - /import : Import existing account
 *     - /import/seed : Import by seed phrase
 *     - /import/ledger : Import from Ledger
 *     - /import/keeper : Import from Keeper
 * - /desktop : Protected authenticated layout
 *   - /desktop/wallet : Wallet module with nested routes
 *     - /desktop/wallet/portfolio : Portfolio view
 *     - /desktop/wallet/transactions : Transaction history
 *     - /desktop/wallet/assets/:assetId : Asset details
 *     - /desktop/wallet/leasing : Leasing management
 *   - /desktop/dex : DEX trading module with nested routes
 *     - /desktop/dex : Trading view with default pair
 *     - /desktop/dex/pair/:amountAsset/:priceAsset : Specific trading pair
 *     - /desktop/dex/history : Order and trade history
 *   - /desktop/settings : Settings module with nested routes
 *     - /desktop/settings/general : General preferences
 *     - /desktop/settings/network : Network configuration
 *     - /desktop/settings/security : Security settings
 */
export const router = createBrowserRouter([
  {
    children: [
      {
        element: <LandingPage />, // New modern landing page
        path: '/',
      },
      {
        element: <Welcome />, // Keep old welcome page for reference
        path: '/welcome',
      },
      {
        element: <SignUp />,
        path: '/signup',
      },
      {
        element: <SignUp />,
        path: '/create-account', // Alias for signup - used by landing page
      },
      {
        element: <SignIn />,
        path: '/signin',
      },
      {
        element: <SignIn />,
        path: '/sign-in', // Alias for signin - used by landing page
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
        element: <RestoreFromBackupPage />,
        path: '/restore-backup',
      },
      {
        element: <ImportLedger />,
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
              // Additional routes
              {
                element: <Swap />,
                path: 'swap',
              },
              {
                element: <Bridge />,
                path: 'bridge',
              },
              {
                element: <Markets />,
                path: 'markets',
              },
              {
                element: <OrderBook />,
                path: 'orderbook',
              },
              {
                element: <Analytics />,
                path: 'analytics',
              },
              {
                element: <Messages />,
                path: 'messages',
              },
              {
                element: <CreateToken />,
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
        element: <DexPairAdmin />,
        // Hidden admin route - only accessible via direct URL
        path: '/dccadmin',
      },
      {
        element: <Navigate to="/" replace />,
        // Catch-all route for 404
        path: '*',
      },
    ],
    element: <RootLayout />, // Wrap all routes with RootLayout for GlobalKeyboardShortcuts
  },
]);
