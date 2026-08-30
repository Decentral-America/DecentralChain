/**
 * Markets list — the terminal's left rail.
 *
 * Every configured pair, always visible, so switching market is one click
 * rather than a dropdown. The selected row carries the amount asset's id
 * underneath its name, because two pairs can read identically by ticker and
 * the id is the only thing that distinguishes them.
 */
import { KeyboardArrowDown, Search, Star, StarBorder, UnfoldMore } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { selectSelectedPair, type TradingPair, useDexStore } from '@/stores/dexStore';
import { AVAILABLE_PAIRS, DEFAULT_PAIR, getAssetDisplayName } from './tradingPairs';

/** The display names are optional on the type; fall back to the asset id. */
const baseOf = (p: TradingPair): string => p.amountAssetName ?? getAssetDisplayName(p.amountAsset);
const quoteOf = (p: TradingPair): string => p.priceAssetName ?? getAssetDisplayName(p.priceAsset);

type SortKey = 'chg' | 'pair' | 'price' | 'volume';

const COLUMN_TEMPLATE = '20px minmax(0, 1fr) 58px 44px 58px';

const HeaderCell: React.FC<{ label: string; onSort: () => void; align?: 'left' | 'right' }> = ({
  align = 'right',
  label,
  onSort,
}) => (
  <Box
    onClick={onSort}
    sx={{
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      gap: 0.25,
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      userSelect: 'none',
    }}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
      {label}
    </Typography>
    <UnfoldMore sx={{ color: 'text.disabled', fontSize: 12 }} />
  </Box>
);

export const MarketsPanel: React.FC = () => {
  const selectedPair = useDexStore(selectSelectedPair);
  const setSelectedPair = useDexStore((s) => s.setSelectedPair);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('pair');
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [quote, setQuote] = useState<'all' | string>('all');
  const [quoteMenu, setQuoteMenu] = useState<HTMLElement | null>(null);

  /**
   * Seed the store on mount, and replace a pair carried over from a session on
   * a different network — those arrive with empty asset ids and every panel
   * downstream renders an error for them.
   */
  useEffect(() => {
    const isStale = selectedPair && (!selectedPair.amountAsset || !selectedPair.priceAsset);
    if (isStale || (!selectedPair && DEFAULT_PAIR)) {
      setSelectedPair(DEFAULT_PAIR);
    }
  }, [selectedPair, setSelectedPair]);

  /** Quote assets that actually appear in the configured pairs. */
  const quoteAssets = useMemo(() => [...new Set(AVAILABLE_PAIRS.map(quoteOf))], []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = AVAILABLE_PAIRS.filter((p) => {
      const label = `${baseOf(p)}/${quoteOf(p)}`.toLowerCase();
      const byQuote = quote === 'all' || quoteOf(p) === quote;
      return byQuote && (needle === '' || label.includes(needle));
    });

    if (sort === 'pair') {
      return [...matches].sort((a, b) => baseOf(a).localeCompare(baseOf(b)));
    }
    // Price, change and volume are per-pair market data the terminal does not
    // hold for every row — sorting by them would reorder on nothing. Left as
    // the configured order until those aggregates are fetched per pair.
    return matches;
  }, [query, quote, sort]);

  const keyOf = (p: TradingPair) => `${p.amountAsset}/${p.priceAsset}`;

  const toggleFavourite = (key: string) =>
    setFavourites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider',
        borderRight: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/*
        One "all" switch and a quote picker, rather than a tab per quote asset.
        A network can configure any number of quotes and a tab strip silently
        overflows past three or four of them.
      */}
      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexShrink: 0,
          gap: 0.5,
          minHeight: 40,
          px: 1,
        }}
      >
        <Button
          size="small"
          onClick={() => setQuote('all')}
          sx={{
            borderBottom: 2,
            borderColor: quote === 'all' ? 'primary.main' : 'transparent',
            borderRadius: 0,
            color: quote === 'all' ? 'primary.main' : 'text.primary',
            fontSize: 12,
            minWidth: 0,
            px: 1.5,
          }}
        >
          ALL
        </Button>
        <Button
          size="small"
          onClick={(e) => setQuoteMenu(e.currentTarget)}
          endIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
          sx={{
            borderBottom: 2,
            borderColor: quote === 'all' ? 'transparent' : 'primary.main',
            borderRadius: 0,
            color: quote === 'all' ? 'text.primary' : 'primary.main',
            fontSize: 12,
            minWidth: 0,
            px: 1.5,
          }}
        >
          {quote === 'all' ? (quoteAssets[0] ?? 'Quote') : quote}
        </Button>
        <Menu anchorEl={quoteMenu} open={Boolean(quoteMenu)} onClose={() => setQuoteMenu(null)}>
          {quoteAssets.map((asset) => (
            <MenuItem
              key={asset}
              selected={quote === asset}
              onClick={() => {
                setQuote(asset);
                setQuoteMenu(null);
              }}
              sx={{ fontSize: 13 }}
            >
              {asset}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          px: 1.5,
          py: 0.75,
        }}
      >
        <Search sx={{ color: 'text.disabled', fontSize: 18 }} />
        <InputBase
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          sx={{ flex: 1, fontSize: 11 }}
          inputProps={{ 'aria-label': 'Search markets' }}
        />
        <Tooltip title="Pairs come from the network configuration">
          <IconButton size="small" sx={{ color: 'text.disabled' }} aria-label="About these pairs">
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              i
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'grid',
          gap: 0.75,
          gridTemplateColumns: COLUMN_TEMPLATE,
          px: 1.5,
          py: 0.75,
        }}
      >
        <Box />
        <HeaderCell label="Pair" align="left" onSort={() => setSort('pair')} />
        <HeaderCell label="Price" onSort={() => setSort('price')} />
        <HeaderCell label="Chg" onSort={() => setSort('chg')} />
        <HeaderCell label="Volume" onSort={() => setSort('volume')} />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {rows.map((pair) => {
          const key = keyOf(pair);
          const isSelected = selectedPair ? keyOf(selectedPair) === key : false;
          const isFavourite = favourites.has(key);

          return (
            <Box
              key={key}
              onClick={() => setSelectedPair(pair)}
              sx={{
                '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                cursor: 'pointer',
                px: 1.5,
                py: 0.75,
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'grid',
                  gap: 0.75,
                  gridTemplateColumns: COLUMN_TEMPLATE,
                }}
              >
                <IconButton
                  size="small"
                  aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavourite(key);
                  }}
                  sx={{ color: isFavourite ? 'warning.main' : 'text.disabled', p: 0 }}
                >
                  {isFavourite ? (
                    <Star sx={{ fontSize: 14 }} />
                  ) : (
                    <StarBorder sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
                <Typography variant="body2" noWrap sx={{ fontSize: 11 }}>
                  {baseOf(pair)} / {quoteOf(pair)}
                </Typography>
                {/* Per-pair aggregates are not fetched for the whole list yet. */}
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontSize: 11, textAlign: 'right' }}
                >
                  —
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontSize: 11, textAlign: 'right' }}
                >
                  0%
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontSize: 11, textAlign: 'right' }}
                >
                  —
                </Typography>
              </Box>

              {isSelected && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    pl: 4,
                    pt: 0.5,
                    wordBreak: 'break-all',
                  }}
                >
                  {pair.amountAsset} / {pair.priceAsset}
                </Typography>
              )}
            </Box>
          );
        })}

        {rows.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>
            No pairs match “{query}”.
          </Typography>
        )}
      </Box>
    </Box>
  );
};
