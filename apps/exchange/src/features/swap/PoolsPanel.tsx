/**
 * Every pool, and what is in it.
 *
 * Reserves and LP supply are contract state; volume, fees and swap counts come
 * from the indexer. Where the indexer is unreachable those read as em dashes
 * rather than zeros — a pool with no data is not a pool with no volume, and
 * the difference matters to anyone deciding where to put money.
 */
import { fromRawAmount } from '@dcc-amm/sdk';
import { KeyboardArrowDown, Search, Star, StarBorder } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { TokenIcon } from '@/components/common/TokenIcon';
import { DCC_ASSET } from '@/config/amm';
import { type AmmPool, useAmmAssetMeta, useAmmPools } from '@/hooks/useAmm';
import { usePoolStats } from '@/hooks/useAmmIndexer';
import { type PoolStats } from '@/services/amm/indexer';
import { PoolDetailDialog } from './PoolDetailDialog';
import { PanelTitle, SurfaceCard } from './ui';

type SortKey = 'fee' | 'tvl' | 'volume';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'tvl', label: 'Sort: TVL' },
  { key: 'volume', label: 'Sort: Volume' },
  { key: 'fee', label: 'Sort: Fee' },
];

/** A dropdown that reads as a chip rather than a form control. */
const FilterChip: React.FC<{
  active?: boolean;
  label: string;
  onClick: (anchor: HTMLElement) => void;
  startIcon?: React.ReactNode;
}> = ({ active = false, label, onClick, startIcon }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={(e) => onClick(e.currentTarget)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick(e.currentTarget);
    }}
    sx={{
      alignItems: 'center',
      border: 1,
      borderColor: active ? 'primary.main' : 'divider',
      borderRadius: 1.5,
      color: active ? 'primary.main' : 'text.secondary',
      cursor: 'pointer',
      display: 'inline-flex',
      fontSize: '0.8125rem',
      gap: 0.5,
      px: 1.25,
      py: 0.625,
      userSelect: 'none',
    }}
  >
    {startIcon}
    {label}
  </Box>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.375 }}>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{value}</Typography>
  </Stack>
);

const PoolCard: React.FC<{
  decimalsOf: (id: string) => number;
  isFavourite: boolean;
  nameOf: (id: string) => string;
  onOpen: () => void;
  onToggleFavourite: () => void;
  pool: AmmPool;
  stats?: PoolStats | undefined;
}> = ({ decimalsOf, isFavourite, nameOf, onOpen, onToggleFavourite, pool, stats }) => {
  const r0 = Number(fromRawAmount(pool.reserve0, decimalsOf(pool.token0)));
  const r1 = Number(fromRawAmount(pool.reserve1, decimalsOf(pool.token1)));
  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <Paper
      variant="outlined"
      onClick={onOpen}
      sx={{
        '@media (prefers-reduced-motion: reduce)': {
          '&:active': { transform: 'none' },
          transition: 'none',
        },
        '&:active': { transform: 'scale(0.997)' },
        '&:hover': { borderColor: 'primary.light' },
        borderRadius: 2.5,
        cursor: 'pointer',
        p: 2,
        transition: 'border-color 120ms, transform 100ms ease-out',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          role="button"
          tabIndex={0}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onToggleFavourite();
            }
          }}
          sx={{
            color: isFavourite ? 'warning.main' : 'text.disabled',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          {isFavourite ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
        </Box>

        {/* The pair's two marks, overlapped — one object, two assets. */}
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          <TokenIcon name={nameOf(pool.token0)} seed={pool.token0} size={26} />
          <Box sx={{ ml: -1 }}>
            <TokenIcon name={nameOf(pool.token1)} seed={pool.token1} size={26} />
          </Box>
        </Box>

        <Typography
          sx={{ flex: 1, fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          {nameOf(pool.token0)} / {nameOf(pool.token1)}
        </Typography>

        <Chip
          label={`${Number(pool.feeBps) / 100}%`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 1.5, mb: 1.5, px: 1.5, py: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', fontWeight: 600 }}>
            {stats ? `${stats.apy.toFixed(2)}%` : '—'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>APY</Typography>
        </Stack>
      </Paper>

      <DetailRow label={`Reserve ${nameOf(pool.token0)}`} value={fmt(r0)} />
      <DetailRow label={`Reserve ${nameOf(pool.token1)}`} value={fmt(r1)} />
      <DetailRow label="LP supply" value={fromRawAmount(pool.lpSupply, 8)} />
      <DetailRow label="Swaps (24h)" value={stats ? String(stats.txCount24h) : '—'} />
    </Paper>
  );
};

export const PoolsPanel: React.FC = () => {
  const { data: pools, error, isLoading } = useAmmPools();
  const { metaById } = useAmmAssetMeta(pools);
  const poolKeys = useMemo(() => (pools ?? []).map((p) => p.poolId), [pools]);
  const { data: statsByKey } = usePoolStats(poolKeys);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('tvl');
  const [feeFilter, setFeeFilter] = useState<number | null>(null);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [feeAnchor, setFeeAnchor] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<AmmPool | null>(null);

  const nameOf = useCallback(
    (assetId: string) =>
      metaById.get(assetId)?.name ?? (assetId === DCC_ASSET ? 'DCC' : `${assetId.slice(0, 6)}…`),
    [metaById],
  );

  const decimalsOf = useCallback(
    (assetId: string) => metaById.get(assetId)?.decimals ?? 8,
    [metaById],
  );

  const feeTiers = useMemo(
    () => [...new Set((pools ?? []).map((p) => Number(p.feeBps)))].sort((a, b) => a - b),
    [pools],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = (pools ?? []).filter((pool) => {
      if (favouritesOnly && !favourites.has(pool.poolId)) return false;
      if (feeFilter !== null && Number(pool.feeBps) !== feeFilter) return false;
      if (!needle) return true;
      return `${nameOf(pool.token0)}/${nameOf(pool.token1)}`.toLowerCase().includes(needle);
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'fee') return Number(a.feeBps) - Number(b.feeBps);
      if (sort === 'volume') {
        const av = Number(statsByKey?.get(a.poolId)?.volume24h ?? 0);
        const bv = Number(statsByKey?.get(b.poolId)?.volume24h ?? 0);
        return bv - av;
      }
      // TVL, approximated by the first reserve — both sides of a pool are the
      // same value by construction, so one side ranks them correctly.
      return Number(b.reserve0) - Number(a.reserve0);
    });
  }, [pools, query, sort, feeFilter, favouritesOnly, favourites, statsByKey, nameOf]);

  const toggleFavourite = (poolId: string) =>
    setFavourites((current) => {
      const next = new Set(current);
      if (next.has(poolId)) next.delete(poolId);
      else next.add(poolId);
      return next;
    });

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (error) {
    return (
      <SurfaceCard>
        <Alert severity="error">Could not read pools: {(error as Error).message}</Alert>
      </SurfaceCard>
    );
  }

  return (
    <>
      <SurfaceCard>
        <PanelTitle
          action={
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {pools?.length ?? 0} pool{(pools?.length ?? 0) === 1 ? '' : 's'}
            </Typography>
          }
        >
          Pools
        </PanelTitle>

        <Stack spacing={1.5}>
          <Paper
            variant="outlined"
            sx={{ alignItems: 'center', borderRadius: 2, display: 'flex', gap: 1, px: 1.5, py: 1 }}
          >
            <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pools…"
              sx={{ flex: 1, fontSize: '0.9375rem' }}
              inputProps={{ 'aria-label': 'Search pools' }}
            />
          </Paper>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <FilterChip
              active={favouritesOnly}
              label="Favourites"
              onClick={() => setFavouritesOnly((v) => !v)}
              startIcon={<StarBorder sx={{ fontSize: 16 }} />}
            />
            <FilterChip
              active={feeFilter !== null}
              label={feeFilter === null ? 'All fees' : `${feeFilter / 100}%`}
              onClick={setFeeAnchor}
              startIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
            />
            <FilterChip
              label={SORTS.find((s) => s.key === sort)?.label ?? 'Sort'}
              onClick={setSortAnchor}
              startIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
            />
          </Stack>

          <Menu anchorEl={feeAnchor} open={Boolean(feeAnchor)} onClose={() => setFeeAnchor(null)}>
            <MenuItem
              onClick={() => {
                setFeeFilter(null);
                setFeeAnchor(null);
              }}
            >
              All fees
            </MenuItem>
            {feeTiers.map((tier) => (
              <MenuItem
                key={tier}
                onClick={() => {
                  setFeeFilter(tier);
                  setFeeAnchor(null);
                }}
              >
                {tier / 100}%
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={sortAnchor}
            open={Boolean(sortAnchor)}
            onClose={() => setSortAnchor(null)}
          >
            {SORTS.map((option) => (
              <MenuItem
                key={option.key}
                selected={option.key === sort}
                onClick={() => {
                  setSort(option.key);
                  setSortAnchor(null);
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          {visible.length === 0 && (
            <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
              {query || favouritesOnly || feeFilter !== null
                ? 'No pool matches these filters.'
                : 'The AMM holds no pools yet.'}
            </Typography>
          )}

          {visible.map((pool) => (
            <PoolCard
              key={pool.poolId}
              decimalsOf={decimalsOf}
              isFavourite={favourites.has(pool.poolId)}
              nameOf={nameOf}
              onOpen={() => setSelected(pool)}
              onToggleFavourite={() => toggleFavourite(pool.poolId)}
              pool={pool}
              stats={statsByKey?.get(pool.poolId)}
            />
          ))}
        </Stack>
      </SurfaceCard>

      <PoolDetailDialog
        decimalsOf={decimalsOf}
        nameOf={nameOf}
        onClose={() => setSelected(null)}
        pool={selected}
        stats={selected ? statsByKey?.get(selected.poolId) : undefined}
      />
    </>
  );
};
