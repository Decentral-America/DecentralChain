/**
 * A real call site resolves a real logo.
 *
 * `TokenIcon.logo.test.tsx` proves the component renders a logo when it is
 * handed an `assetId`. It cannot prove anything ships, because it constructs
 * the element itself. Every one of the eight call sites in the app passed only
 * `name` and `seed`, so `useTokenLogo(undefined)` short-circuited and no logo
 * rendered anywhere — a whole feature that was green across tsc, biome and the
 * entire suite while doing nothing at all.
 *
 * This mounts a shipped component and asserts the logo arrives, so the wiring
 * itself is what is under test. `PoolDetailDialog` is the cheapest of the
 * wired sites to mount (two hooks, and the pool comes in as a prop), and it
 * passes `pool.token0` — the same identifier `PoolsPanel`, `MyPoolsPanel` and
 * `ExplorePanel` pass.
 *
 * `SupportedTokensCard` is deliberately NOT covered here: it keys on
 * `token.splMint`, a Solana mint address. Base58 too, so `isValidAssetId`
 * accepts it, but it is not a DecentralChain asset id and the URL it would
 * derive points at a logo that cannot exist.
 */
import { ThemeProvider } from '@mui/material/styles';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '@/config';
import { type AmmPool } from '@/hooks/useAmm';
import { loadManifest, resetManifestCache } from '@/lib/tokenLogos/load';
import { createAppTheme } from '@/theme/mui-theme';
import { PoolDetailDialog } from '../PoolDetailDialog';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { address: '3PabcTestAddress' } }),
}));
vi.mock('@/hooks/useAmm', () => ({ useLpPosition: () => ({ data: 0n }) }));

const TOKEN0 = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
const TOKEN1 = 'h82pJGF9p7kpzb6eU326EFZf2cDnimbTFVeJtx1qtBmU';
const TOKEN0_LOGO = 'data:image/webp;base64,AAAA';
const MANIFEST = { hot: { [TOKEN0]: TOKEN0_LOGO }, sha: 'a1b2c3d' };

const POOL = {
  createdAt: 0,
  exists: true,
  feeBps: 30n,
  fees0: 0n,
  fees1: 0n,
  lastK: 0n,
  lpAssetId: '',
  lpSupply: 1000n,
  poolId: `p:${TOKEN0}:${TOKEN1}:30`,
  reserve0: 1000n,
  reserve1: 1000n,
  swapCount: 0,
  token0: TOKEN0,
  token1: TOKEN1,
  volume0: 0n,
  volume1: 0n,
} satisfies AmmPool;

beforeEach(() => {
  resetManifestCache();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ json: () => Promise.resolve(MANIFEST), ok: true }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TokenIcon wiring at a shipped call site', () => {
  it('renders the hot-set logo for the pool it is showing', async () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <PoolDetailDialog
          decimalsOf={() => 8}
          nameOf={(id) => `Token ${id.slice(0, 4)}`}
          onClose={() => {}}
          pool={POOL}
        />
      </ThemeProvider>,
    );

    // Awaiting the same cached promise the hook awaits, inside `act`, flushes
    // the hook's `setSrc` before the assertion. A bare `waitFor` on a negative
    // would pass at the pre-resolution render and observe nothing.
    await act(async () => {
      await loadManifest(config.logoRepo);
    });

    const img = document.body.querySelector('img');
    expect(img).toHaveAttribute('src', TOKEN0_LOGO);
  });
});
