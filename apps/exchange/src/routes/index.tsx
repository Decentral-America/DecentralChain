/**
 * Application Router Configuration
 * Defines all routes using React Router v6 createBrowserRouter
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout';
import { walletRoutes } from './walletRoutes';
import { dexRoutes } from './dexRoutes';
import { settingsRoutes } from './settingsRoutes';

// Direct imports for auth pages (critical entry points)
import LandingPage from '@/pages/LandingPage';
import { Welcome } from '@/pages/Welcome';
import { SignUp } from '@/pages/SignUp';
import { SignIn } from '@/pages/SignIn';
import { ImportAccountPage } from '@/pages/ImportAccountPage';
import { SaveSeedPage } from '@/pages/SaveSeed';
import { RestoreFromBackupPage } from '@/pages/RestoreFromBackup';
import { ImportLedger } from '@/pages/ImportLedger';

// Additional pages
import { Markets } from '@/pages/Markets';
import { OrderBook } from '@/pages/OrderBook';
import { Analytics } from '@/pages/Analytics';
import { Messages } from '@/pages/Messages';
import { CreateToken } from '@/pages/CreateToken';
import { Swap } from '@/pages/Swap';
import { Bridge } from '@/pages/Bridge';

// Admin pages (hidden routes)
import { DexPairAdmin } from '@/pages/admin/DexPairAdmin';

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
    element: <RootLayout />, // Wrap all routes with RootLayout for GlobalKeyboardShortcuts
    children: [
      {
        path: '/',
        element: <LandingPage />, // New modern landing page
      },
      {
        path: '/welcome',
        element: <Welcome />, // Keep old welcome page for reference
      },
      {
        path: '/signup',
        element: <SignUp />,
      },
      {
        path: '/create-account', // Alias for signup - used by landing page
        element: <SignUp />,
      },
      {
        path: '/signin',
        element: <SignIn />,
      },
      {
        path: '/sign-in', // Alias for signin - used by landing page
        element: <SignIn />,
      },
      {
        path: '/import-account',
        element: <ImportAccountPage />,
      },
      {
        path: '/save-seed',
        element: <SaveSeedPage />,
      },
      {
        path: '/restore-backup',
        element: <RestoreFromBackupPage />,
      },
      {
        path: '/import/ledger',
        element: <ImportLedger />,
      },
      {
        path: '/desktop',
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/desktop/wallet" replace />,
              },
              walletRoutes,
              dexRoutes,
              settingsRoutes,
              // Additional routes
              {
                path: 'swap',
                element: <Swap />,
              },
              {
                path: 'bridge',
                element: <Bridge />,
              },
              {
                path: 'markets',
                element: <Markets />,
              },
              {
                path: 'orderbook',
                element: <OrderBook />,
              },
              {
                path: 'analytics',
                element: <Analytics />,
              },
              {
                path: 'messages',
                element: <Messages />,
              },
              {
                path: 'create-token',
                element: <CreateToken />,
              },
            ],
          },
        ],
      },
      {
        // Hidden admin route - only accessible via direct URL
        path: '/dccadmin',
        element: <DexPairAdmin />,
      },
      {
        // Catch-all route for 404
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
