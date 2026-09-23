/**
 * One pool, in full.
 *
 * Reserves, LP supply and your own position come from the chain; volume, fees
 * and swap counts from the indexer. Where a figure is only knowable over a
 * window, the label says which window — "24h volume", not "volume" — because
 * an unqualified number here would be read as all-time.
 */
import { fromRawAmount } from '@dcc-amm/sdk';
import { Close } from '@mui/icons-material';
import { Box, Dialog, DialogContent, Divider, IconButton, Stack, Typography } from '@mui/material';
import { TokenIcon } from '@/components/common/TokenIcon';
import { useAuth } from '@/contexts/AuthContext';
import { type AmmPool, useLpPosition } from '@/hooks/useAmm';
import { type PoolStats } from '@/services/amm/indexer';

const Row: React.FC<{ label: string; note?: string | undefined; value: string }> = ({
  label,
  note,
  value,
}) => (
  <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', py: 0.75 }}>
    <Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{label}</Typography>
      {note && (
        <Typography sx={{ color: 'text.disabled', fontSize: '0.6875rem' }}>{note}</Typography>
      )}
    </Box>
    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
      {value}
    </Typography>
  </Stack>
);

interface PoolDetailDialogProps {
  decimalsOf: (assetId: string) => number;
  nameOf: (assetId: string) => string;
  onClose: () => void;
  pool: AmmPool | null;
  stats?: PoolStats | undefined;
}

export const PoolDetailDialog: React.FC<PoolDetailDialogProps> = ({
  decimalsOf,
  nameOf,
  onClose,
  pool,
  stats,
}) => {
  const { user } = useAuth();
  const { data: lp } = useLpPosition(pool ?? undefined, user?.address);

  if (!pool) return null;

  const d0 = decimalsOf(pool.token0);
  const d1 = decimalsOf(pool.token1);
  const r0 = Number(fromRawAmount(pool.reserve0, d0));
  const r1 = Number(fromRawAmount(pool.reserve1, d1));

  /**
   * `lpSupply` includes the permanently locked minimum liquidity, so this is
   * the honest denominator rather than a slightly flattering one.
   */
  const share = lp && pool.lpSupply > 0n ? (Number(lp) / Number(pool.lpSupply)) * 100 : 0;

  const fmt = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
          <TokenIcon name={nameOf(pool.token0)} assetId={pool.token0} size={32} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {nameOf(pool.token0)} / {nameOf(pool.token1)}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
              {Number(pool.feeBps) / 100}% fee ·{' '}
              {pool.lpAssetId ? 'LP token issued' : 'legacy ledger position'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        <Row label={`Reserve ${nameOf(pool.token0)}`} value={fmt(r0)} />
        <Row label={`Reserve ${nameOf(pool.token1)}`} value={fmt(r1)} />
        <Row
          label="Spot price"
          value={`1 ${nameOf(pool.token0)} = ${r0 > 0 ? (r1 / r0).toFixed(6) : '—'} ${nameOf(pool.token1)}`}
        />
        <Row label="LP supply" value={fromRawAmount(pool.lpSupply, 8)} />

        <Divider sx={{ my: 1.5 }} />

        <Row
          label="Your position"
          note={lp && lp > 0n ? `${fromRawAmount(lp, 8)} LP` : undefined}
          value={lp && lp > 0n ? `${share.toFixed(4)}%` : '—'}
        />

        <Divider sx={{ my: 1.5 }} />

        {/*
          Everything below needs the indexer. When it is unreachable these read
          as em dashes rather than zeros — a pool with no data is not a pool
          with no volume.
        */}
        <Row label="24h volume" value={stats ? fromRawAmount(BigInt(stats.volume24h), 8) : '—'} />
        <Row label="7d volume" value={stats ? fromRawAmount(BigInt(stats.volume7d), 8) : '—'} />
        <Row label="24h fees" value={stats ? fromRawAmount(BigInt(stats.fees24h), 8) : '—'} />
        <Row label="24h swaps" value={stats ? String(stats.txCount24h) : '—'} />
        <Row
          label="APY"
          note="Reported by the indexer; 0 until there is enough history"
          value={stats ? `${stats.apy.toFixed(2)}%` : '—'}
        />

        <Divider sx={{ my: 1.5 }} />

        <Typography sx={{ color: 'text.secondary', fontSize: '0.6875rem', mb: 0.5 }}>
          Pool key
        </Typography>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6875rem', wordBreak: 'break-all' }}>
          {pool.poolId}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};
