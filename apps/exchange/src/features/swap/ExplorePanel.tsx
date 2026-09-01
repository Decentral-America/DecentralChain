/**
 * Protocol-wide figures.
 *
 * Every number here comes from the indexer: TVL summed across pools, volume,
 * swap counts. None of it is answerable from contract state, which is why this
 * tab exists separately from Pools — that one reads the chain, this one reads
 * history.
 */
import { fromRawAmount } from '@dcc-amm/sdk';
import { Search } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  InputBase,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { TokenIcon } from '@/components/common/TokenIcon';
import { DCC_ASSET } from '@/config/amm';
import { useAmmAssetMeta, useAmmPools } from '@/hooks/useAmm';
import { usePoolStats, useRecentSwaps } from '@/hooks/useAmmIndexer';

const compact = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

const StatTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2.5, flex: '1 1 160px', px: 2, py: 1.75 }}>
    <Typography
      sx={{
        color: 'text.secondary',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
    {/* Weight, not size, carries the emphasis — a thin large figure reads as
        less important than its size implies. */}
    <Typography
      sx={{
        fontSize: '1.375rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        mt: 0.25,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

export const ExplorePanel: React.FC = () => {
  const { data: pools, isLoading } = useAmmPools();
  const { metaById } = useAmmAssetMeta(pools);
  const poolKeys = useMemo(() => (pools ?? []).map((p) => p.poolId), [pools]);
  const { data: statsByKey } = usePoolStats(poolKeys);
  const { data: swaps } = useRecentSwaps(25);

  const [tab, setTab] = useState<'pools' | 'tokens' | 'transactions'>('tokens');
  const [query, setQuery] = useState('');

  const nameOf = useCallback(
    (assetId: string) =>
      metaById.get(assetId)?.name ?? (assetId === DCC_ASSET ? 'DCC' : `${assetId.slice(0, 6)}…`),
    [metaById],
  );

  const decimalsOf = useCallback(
    (assetId: string) => metaById.get(assetId)?.decimals ?? 8,
    [metaById],
  );

  /**
   * TVL and volume per asset, summed over every pool it appears in.
   *
   * An asset in two pools has its reserves counted once per pool, which is
   * what "total value locked in this token" means — not a double count.
   */
  const tokenRows = useMemo(() => {
    const rows = new Map<string, { pools: number; tvl: number; volume: number }>();

    for (const pool of pools ?? []) {
      const stats = statsByKey?.get(pool.poolId);
      const volume = stats ? Number(fromRawAmount(BigInt(stats.volume24h), 8)) : 0;

      for (const [assetId, reserve] of [
        [pool.token0, pool.reserve0],
        [pool.token1, pool.reserve1],
      ] as const) {
        const current = rows.get(assetId) ?? { pools: 0, tvl: 0, volume: 0 };
        current.pools += 1;
        current.tvl += Number(fromRawAmount(reserve, decimalsOf(assetId)));
        current.volume += volume;
        rows.set(assetId, current);
      }
    }

    const needle = query.trim().toLowerCase();

    return [...rows.entries()]
      .map(([assetId, data]) => ({ assetId, ...data }))
      .filter((row) => !needle || nameOf(row.assetId).toLowerCase().includes(needle))
      .sort((a, b) => b.tvl - a.tvl);
  }, [pools, statsByKey, query, nameOf, decimalsOf]);

  const totals = useMemo(() => {
    let tvl = 0;
    let volume = 0;
    let swapCount = 0;

    for (const pool of pools ?? []) {
      tvl += Number(fromRawAmount(pool.reserve0, decimalsOf(pool.token0)));
      const stats = statsByKey?.get(pool.poolId);
      if (stats) {
        volume += Number(fromRawAmount(BigInt(stats.volume24h), 8));
        swapCount += stats.txCount24h;
      }
    }

    return { pools: pools?.length ?? 0, swapCount, tvl, volume };
  }, [pools, statsByKey, decimalsOf]);

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
        <StatTile label="Total TVL" value={`${compact(totals.tvl)} DCC`} />
        <StatTile label="24h volume" value={`${compact(totals.volume)} DCC`} />
        <StatTile label="Pools" value={String(totals.pools)} />
        <StatTile label="24h swaps" value={String(totals.swapCount)} />
      </Stack>

      <Paper
        variant="outlined"
        sx={{ alignItems: 'center', borderRadius: 2.5, display: 'flex', gap: 1, px: 2, py: 1 }}
      >
        <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
        <InputBase
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens…"
          sx={{ flex: 1, fontSize: '0.9375rem' }}
          inputProps={{ 'aria-label': 'Search tokens' }}
        />
      </Paper>

      <Box>
        <Tabs
          value={tab}
          onChange={(_e, value: typeof tab) => setTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
        >
          <Tab value="tokens" label="Tokens" sx={{ minHeight: 40, textTransform: 'none' }} />
          <Tab value="pools" label="Pools" sx={{ minHeight: 40, textTransform: 'none' }} />
          <Tab
            value="transactions"
            label="Transactions"
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
        </Tabs>

        {tab === 'tokens' && (
          <Box sx={{ mt: 1.5 }}>
            <Box
              sx={{
                color: 'text.secondary',
                display: 'grid',
                fontSize: '0.6875rem',
                fontWeight: 600,
                gridTemplateColumns: '28px 1fr 1fr 1fr 64px',
                letterSpacing: '0.06em',
                px: 1.5,
                py: 1,
                textTransform: 'uppercase',
              }}
            >
              <Box>#</Box>
              <Box>Token</Box>
              <Box sx={{ textAlign: 'right' }}>TVL</Box>
              <Box sx={{ textAlign: 'right' }}>24h volume</Box>
              <Box sx={{ textAlign: 'right' }}>Pools</Box>
            </Box>

            {tokenRows.map((row, index) => (
              <Box
                key={row.assetId}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  alignItems: 'center',
                  borderColor: 'divider',
                  borderTop: 1,
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 1fr 1fr 64px',
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                  {index + 1}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <TokenIcon name={nameOf(row.assetId)} assetId={row.assetId} size={22} />
                  <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {nameOf(row.assetId)}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.875rem', textAlign: 'right' }}>
                  {compact(row.tvl)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', textAlign: 'right' }}>
                  {compact(row.volume)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', textAlign: 'right' }}>
                  {row.pools}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {tab === 'transactions' && (
          <Box sx={{ mt: 1.5 }}>
            {(swaps ?? []).length === 0 && (
              <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                No swaps recorded yet.
              </Typography>
            )}
            {(swaps ?? []).map((swap) => (
              <Box
                key={swap.txId}
                sx={{
                  alignItems: 'center',
                  borderColor: 'divider',
                  borderTop: 1,
                  display: 'flex',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {nameOf(swap.inputAsset)} → {nameOf(swap.outputAsset)}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {new Date(swap.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.875rem', textAlign: 'right' }}>
                  {fromRawAmount(BigInt(swap.amountIn), decimalsOf(swap.inputAsset))}{' '}
                  {nameOf(swap.inputAsset)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {tab === 'pools' && (
          <Box sx={{ mt: 1.5 }}>
            {(pools ?? []).map((pool) => {
              const stats = statsByKey?.get(pool.poolId);
              return (
                <Box
                  key={pool.poolId}
                  sx={{
                    alignItems: 'center',
                    borderColor: 'divider',
                    borderTop: 1,
                    display: 'flex',
                    gap: 1.5,
                    px: 1.5,
                    py: 1.25,
                  }}
                >
                  <Typography sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                    {nameOf(pool.token0)} / {nameOf(pool.token1)}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {Number(pool.feeBps) / 100}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', minWidth: 96, textAlign: 'right' }}>
                    {stats
                      ? `${compact(Number(fromRawAmount(BigInt(stats.volume24h), 8)))} vol`
                      : '—'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Stack>
  );
};
