/**
 * Wallet Module Routes
 * Defines routes for wallet dashboard, portfolio, transactions, leasing, aliases
 */
import { RouteObject } from 'react-router-dom';
import { Wallet } from '@/pages/Wallet';
import { Dashboard } from '@/pages/Dashboard';
import { Portfolio } from '@/features/wallet';
import { TransactionsModern } from '@/features/wallet/TransactionsModern';
import { LeasingModern } from '@/features/wallet/LeasingModern';
import { AliasManagement } from '@/pages/AliasManagement';

/**
 * Wallet routes structure:
 * - /desktop/wallet : Main wallet dashboard overview
 *   - /desktop/wallet/portfolio : Portfolio overview with asset balances
 *   - /desktop/wallet/transactions : Transaction history and details
 *   - /desktop/wallet/assets/:assetId : Individual asset details
 *   - /desktop/wallet/leasing : Leasing management (stake/lease WAVES)
 *   - /desktop/wallet/aliases : Alias management (create and view aliases)
 */
export const walletRoutes: RouteObject = {
  path: 'wallet',
  element: <Wallet />,
  children: [
    // Dashboard overview at /desktop/wallet
    {
      index: true,
      element: <Dashboard />,
    },
    {
      path: 'portfolio',
      element: <Portfolio />,
    },
    {
      path: 'transactions',
      element: <TransactionsModern />,
    },
    {
      path: 'leasing',
      element: <LeasingModern />,
    },
    {
      path: 'aliases',
      element: <AliasManagement />,
    },
    // Future child routes:
    // {
    //   path: 'assets/:assetId',
    //   element: <AssetDetails />,
    // },
  ],
};
