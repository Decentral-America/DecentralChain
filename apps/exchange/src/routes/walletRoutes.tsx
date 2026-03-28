/**
 * Wallet Module Routes
 * Defines routes for wallet dashboard, portfolio, transactions, leasing, aliases
 */
import { type RouteObject } from 'react-router-dom';

/**
 * Wallet routes structure:
 * - /desktop/wallet : Main wallet dashboard overview
 *   - /desktop/wallet/portfolio : Portfolio overview with asset balances
 *   - /desktop/wallet/transactions : Transaction history and details
 *   - /desktop/wallet/assets/:assetId : Individual asset details
 *   - /desktop/wallet/leasing : Leasing management (stake/lease DCC)
 *   - /desktop/wallet/aliases : Alias management (create and view aliases)
 *
 * Uses React Router v7 `lazy` for code splitting — all wallet page components
 * are excluded from the main bundle and loaded on first navigation to that route.
 */
export const walletRoutes: RouteObject = {
  children: [
    // Dashboard overview at /desktop/wallet
    {
      index: true,
      lazy: async () => {
        const { Dashboard } = await import('@/pages/Dashboard');
        return { Component: Dashboard };
      },
    },
    {
      lazy: async () => {
        const { Portfolio } = await import('@/features/wallet');
        return { Component: Portfolio };
      },
      path: 'portfolio',
    },
    {
      lazy: async () => {
        const { TransactionsModern } = await import('@/features/wallet/TransactionsModern');
        return { Component: TransactionsModern };
      },
      path: 'transactions',
    },
    {
      lazy: async () => {
        const { LeasingModern } = await import('@/features/wallet/LeasingModern');
        return { Component: LeasingModern };
      },
      path: 'leasing',
    },
    {
      lazy: async () => {
        const { AliasManagement } = await import('@/pages/AliasManagement');
        return { Component: AliasManagement };
      },
      path: 'aliases',
    },
    // Future child routes:
    // {
    //   path: 'assets/:assetId',
    //   lazy: async () => { const { AssetDetails } = await import('@/pages/AssetDetails'); return { Component: AssetDetails }; },
    // },
  ],
  lazy: async () => {
    const { Wallet } = await import('@/pages/Wallet');
    return { Component: Wallet };
  },
  path: 'wallet',
};
