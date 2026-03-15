/**
 * DEX Module Routes
 * Defines routes for decentralized exchange trading interface
 */
import { type RouteObject } from 'react-router-dom';
import { Dex } from '@/pages/Dex';

/**
 * DEX routes structure:
 * - /desktop/dex : Main trading view with default pair
 * - /desktop/dex/pair/:amountAsset/:priceAsset : Trading view for specific pair
 * - /desktop/dex/history : Order history and trade history
 *
 * Trading pairs are specified as amountAsset/priceAsset URL parameters
 * Example: /desktop/dex/pair/DCC/USDT
 */
export const dexRoutes: RouteObject = {
  children: [
    // Child routes will be activated when DEX feature components are created (Phase 5):
    // {
    //   index: true,
    //   element: <TradingView />,
    // },
    // {
    //   path: 'pair/:amountAsset/:priceAsset',
    //   element: <TradingView />,
    // },
    // {
    //   path: 'history',
    //   element: <OrderHistory />,
    // },
  ],
  element: <Dex />,
  path: 'dex',
};
