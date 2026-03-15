/**
 * Wallet Module Routes
 * Defines routes for wallet dashboard, portfolio, transactions, leasing, aliases
 */
import { type RouteObject } from 'react-router-dom';
import { Portfolio } from '@/features/wallet';
import { LeasingModern } from '@/features/wallet/LeasingModern';
import { TransactionsModern } from '@/features/wallet/TransactionsModern';
import { AliasManagement } from '@/pages/AliasManagement';
import { Dashboard } from '@/pages/Dashboard';
import { Wallet } from '@/pages/Wallet';

/**
 * Wallet routes structure:
 * - /desktop/wallet : Main wallet dashboard overview
 *   - /desktop/wallet/portfolio : Portfolio overview with asset balances
 *   - /desktop/wallet/transactions : Transaction history and details
 *   - /desktop/wallet/assets/:assetId : Individual asset details
 *   - /desktop/wallet/leasing : Leasing management (stake/lease DCC)
 *   - /desktop/wallet/aliases : Alias management (create and view aliases)
 */
export const walletRoutes: RouteObject = {
  children: [
    // Dashboard overview at /desktop/wallet
    {
      element: <Dashboard />,
      index: true,
    },
    {
      element: <Portfolio />,
      path: 'portfolio',
    },
    {
      element: <TransactionsModern />,
      path: 'transactions',
    },
    {
      element: <LeasingModern />,
      path: 'leasing',
    },
    {
      element: <AliasManagement />,
      path: 'aliases',
    },
    // Future child routes:
    // {
    //   path: 'assets/:assetId',
    //   element: <AssetDetails />,
    // },
  ],
  element: <Wallet />,
  path: 'wallet',
};
