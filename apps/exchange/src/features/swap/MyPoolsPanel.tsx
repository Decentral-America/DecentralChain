/**
 * The positions this account actually holds.
 *
 * A position is read from the LP token where the pool issued one, and from the
 * contract's internal ledger only for legacy pools that did not. Reading the
 * ledger for a pool with a real token reports zero while the holder has
 * spendable LP tokens — the kind of wrong that makes someone think their
 * money is gone.
 */
import { fromRawAmount } from '@dcc-amm/sdk';
import { AccountCircleOutlined } from '@mui/icons-material';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { TokenIcon } from '@/components/common/TokenIcon';
import { DCC_ASSET } from '@/config/amm';
import { useAuth } from '@/contexts/AuthContext';
import { type AmmPool, useAmmAssetMeta, useAmmPools, useLpPosition } from '@/hooks/useAmm';
import { SurfaceCard } from './ui';

const PositionRow: React.FC<{ nameOf: (id: string) => string; pool: AmmPool }> = ({
  nameOf,
  pool,
}) => {
  const { user } = useAuth();
  const { data: lp } = useLpPosition(pool, user?.address);

  if (!lp || lp === 0n) return null;

  const share = pool.lpSupply > 0n ? (Number(lp) / Number(pool.lpSupply)) * 100 : 0;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <TokenIcon name={nameOf(pool.token0)} seed={pool.token0} size={26} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            {nameOf(pool.token0)} / {nameOf(pool.token1)}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
            {Number(pool.feeBps) / 100}% fee · {pool.lpAssetId ? 'LP token' : 'ledger position'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {share.toFixed(4)}%
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {fromRawAmount(lp, 8)} LP
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export const MyPoolsPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: pools, isLoading } = useAmmPools();
  const { metaById } = useAmmAssetMeta(pools);

  const nameOf = (assetId: string) =>
    metaById.get(assetId)?.name ?? (assetId === DCC_ASSET ? 'DCC' : `${assetId.slice(0, 6)}…`);

  if (!user) {
    return (
      <SurfaceCard>
        <Stack spacing={1.5} sx={{ alignItems: 'center', py: 5, textAlign: 'center' }}>
          <AccountCircleOutlined sx={{ color: 'text.disabled', fontSize: 48 }} />
          <Typography sx={{ color: 'text.secondary' }}>
            Sign in to see the positions you hold.
          </Typography>
        </Stack>
      </SurfaceCard>
    );
  }

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ maxWidth: 520, mx: 'auto', width: '100%' }}>
      {(pools ?? []).map((pool) => (
        <PositionRow key={pool.poolId} nameOf={nameOf} pool={pool} />
      ))}
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', textAlign: 'center' }}>
        Pools you hold no position in are not listed.
      </Typography>
    </Stack>
  );
};
