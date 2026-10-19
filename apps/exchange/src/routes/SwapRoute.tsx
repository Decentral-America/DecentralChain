/**
 * The /desktop/swap screen, or a redirect to the order book on networks with no
 * AMM deployment (a bookmarked Swap URL must not reach mainnet-wired panels).
 */
import { Navigate } from 'react-router';
import { MobilePageShell } from '@/components/mobile/MobilePageShell';
import { AMM_SUPPORTED } from '@/config/amm';
import { ResponsiveScreen } from '@/layouts/ResponsiveScreen';
import { lazyPage } from './lazyPage';

const Swap = lazyPage(() => import('@/pages/Swap'), 'Swap');

export function SwapRoute({ ammSupported = AMM_SUPPORTED }: { ammSupported?: boolean }) {
  if (!ammSupported) return <Navigate to="/desktop/dex" replace />;
  return (
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
  );
}
