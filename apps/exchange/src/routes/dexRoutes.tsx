/**
 * DEX Module Routes
 * Defines routes for decentralized exchange trading interface
 */
import { type RouteObject } from 'react-router';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { ResponsiveScreen } from '@/layouts/ResponsiveLayout';
import { lazyPage } from './lazyPage';

/**
 * DEX routes structure:
 * - /desktop/dex : Main trading view with default pair
 * - /desktop/dex/pair/:amountAsset/:priceAsset : Trading view for specific pair
 * - /desktop/dex/history : Order history and trade history
 *
 * Trading pairs are specified as amountAsset/priceAsset URL parameters
 * Example: /desktop/dex/pair/DCC/USDT
 *
 * Dex carries the charting stack — deferred via `lazyPage`, so it loads only
 * once someone actually trades.
 */
const Dex = lazyPage(() => import('@/pages/Dex'), 'Dex');

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
  element: (
    <ResponsiveScreen
      mobile={
        <MobilePageShell title="Trade" subtitle="Place orders against the live order book.">
          <Dex />
        </MobilePageShell>
      }
      desktop={<Dex />}
    />
  ),
  path: 'dex',
};
