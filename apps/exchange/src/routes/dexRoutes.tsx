/**
 * DEX Module Routes
 * Defines routes for decentralized exchange trading interface
 */
import { type RouteObject } from 'react-router-dom';

/**
 * DEX routes structure:
 * - /desktop/dex : Main trading view with default pair
 * - /desktop/dex/pair/:amountAsset/:priceAsset : Trading view for specific pair
 * - /desktop/dex/history : Order history and trade history
 *
 * Trading pairs are specified as amountAsset/priceAsset URL parameters
 * Example: /desktop/dex/pair/DCC/USDT
 *
 * Uses React Router v7 `lazy` for code splitting — Dex page + TradingView deps
 * are excluded from the main bundle and loaded on first navigation to /desktop/dex.
 */
export const dexRoutes: RouteObject = {
  children: [
    // Child routes will be activated when DEX feature components are created (Phase 5):
    // {
    //   index: true,
    //   lazy: async () => { const { TradingView } = await import('@/features/dex/TradingView'); return { Component: TradingView }; },
    // },
    // {
    //   path: 'pair/:amountAsset/:priceAsset',
    //   lazy: async () => { const { TradingView } = await import('@/features/dex/TradingView'); return { Component: TradingView }; },
    // },
    // {
    //   path: 'history',
    //   lazy: async () => { const { OrderHistory } = await import('@/features/dex/OrderHistory'); return { Component: OrderHistory }; },
    // },
  ],
  lazy: async () => {
    const { Dex } = await import('@/pages/Dex');
    return { Component: Dex };
  },
  path: 'dex',
};
