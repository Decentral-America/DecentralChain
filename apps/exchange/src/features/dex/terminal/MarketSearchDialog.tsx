import { Close, Search, Star, StarBorder } from '@mui/icons-material';
import {
  Box,
  ButtonBase,
  Dialog,
  IconButton,
  InputBase,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AVAILABLE_PAIRS, getAssetDisplayName } from '@/features/dex/tradingPairs';
import {
  selectSelectedPair,
  selectSetSelectedPair,
  type TradingPair,
  useDexStore,
} from '@/stores/dexStore';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';
import { alpha, NUM, REDUCED, T_FAST } from './terminalTokens';

const baseOf = (p: TradingPair) => p.amountAssetName ?? getAssetDisplayName(p.amountAsset);
const quoteOf = (p: TradingPair) => p.priceAssetName ?? getAssetDisplayName(p.priceAsset);
const keyOf = (p: TradingPair) => `${p.amountAsset}/${p.priceAsset}`;
const FAV_KEY = 'dex.favourites';

function loadFavs(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * The market picker, as a command palette.
 *
 * Replaces a permanent markets rail: the chart gets the width back, and a
 * palette is the shape people already reach for with ⌘K. Filters are the quote
 * assets actually configured for this network, not a fixed category strip that
 * would show empty tabs on a network with one quote.
 *
 * Per-market price and change are not fetched for every row — the terminal
 * holds market data for the selected pair only. The columns say so rather
 * than showing a number that would be stale for every row but one.
 */
export function MarketSearchDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const selected = useDexStore(selectSelectedPair);
  const setSelectedPair = useDexStore(selectSetSelectedPair);
  const [query, setQuery] = useState('');
  const [quote, setQuote] = useState<'all' | 'fav' | string>('all');
  const [favs, setFavs] = useState<Set<string>>(loadFavs);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const quotes = useMemo(() => [...new Set(AVAILABLE_PAIRS.map(quoteOf))], []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return AVAILABLE_PAIRS.filter((p) => {
      const label = `${baseOf(p)}/${quoteOf(p)}`.toLowerCase();
      const byTab =
        quote === 'all' || (quote === 'fav' ? favs.has(keyOf(p)) : quoteOf(p) === quote);
      return (
        byTab &&
        (needle === '' || label.includes(needle) || p.amountAsset.toLowerCase().startsWith(needle))
      );
    }).sort((a, b) => baseOf(a).localeCompare(baseOf(b)));
  }, [query, quote, favs]);

  // Reset on open so a stale query never hides the list.
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(rows.length - 1, 0)));
  }, [rows.length]);

  const choose = (p: TradingPair) => {
    setSelectedPair(p);
    onClose();
  };

  const toggleFav = (key: string) =>
    setFavs((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* private mode; the star still works for the session */
      }
      return next;
    });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      const p = rows[cursor];
      if (p) choose(p);
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const tabs: Array<{ label: string; value: string }> = [
    { label: 'All', value: 'all' },
    { label: 'Favorites', value: 'fav' },
    ...quotes.map((q) => ({ label: q, value: q })),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-label="Search markets"
      transitionDuration={{ enter: 180, exit: 120 }}
      slotProps={{
        backdrop: {
          sx: {
            '@media (prefers-reduced-transparency: reduce)': { backdropFilter: 'none' },
            backdropFilter: 'blur(6px)',
            bgcolor: alpha(t.surface.sunken, theme.palette.mode === 'dark' ? 0.6 : 0.35),
          },
        },
        paper: {
          sx: {
            [REDUCED]: { transition: 'opacity 150ms ease' },
            bgcolor: t.surface.overlay,
            border: `1px solid ${t.border.subtle}`,
            borderRadius: radii.cards,
            boxShadow: `0 24px 64px ${alpha(t.surface.sunken, theme.palette.mode === 'dark' ? 0.7 : 0.2)}`,
            maxHeight: 'min(640px, 84vh)',
            mt: '8vh',
            overflow: 'hidden',
          },
        },
      }}
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
    >
      <Box onKeyDown={onKey} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box
          sx={{
            alignItems: 'center',
            borderBottom: `1px solid ${t.border.subtle}`,
            display: 'flex',
            gap: 1.25,
            px: 2,
            py: 1.5,
          }}
        >
          <Search sx={{ color: t.text.tertiary, fontSize: 20 }} />
          <InputBase
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets…"
            inputProps={{ 'aria-label': 'Search markets' }}
            sx={{ flex: 1, fontSize: 16 }}
          />
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{ color: t.text.tertiary }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Box role="tablist" sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', px: 1.5, py: 1 }}>
          {tabs.map((tab) => {
            const on = quote === tab.value;
            return (
              <ButtonBase
                key={tab.value}
                role="tab"
                aria-selected={on}
                onClick={() => setQuote(tab.value)}
                sx={{
                  '&:hover': { color: t.text.primary },
                  [REDUCED]: { transition: 'none' },
                  bgcolor: on ? t.accent.muted : 'transparent',
                  borderRadius: '8px',
                  color: on ? t.accent.primary : t.text.secondary,
                  fontSize: 13,
                  fontWeight: on ? 600 : 500,
                  height: 30,
                  px: 1.25,
                  transition: `background-color ${T_FAST}, color ${T_FAST}`,
                }}
              >
                {tab.label}
              </ButtonBase>
            );
          })}
        </Box>

        <Box
          sx={{
            color: t.text.tertiary,
            display: 'grid',
            fontSize: 10,
            gridTemplateColumns: '28px minmax(0,1fr) 120px 120px',
            letterSpacing: '0.06em',
            px: 2,
            py: 0.75,
            textTransform: 'uppercase',
          }}
        >
          <span />
          <span>Market</span>
          <Box sx={{ textAlign: 'right' }}>Last price</Box>
          <Box sx={{ textAlign: 'right' }}>24h change</Box>
        </Box>

        <Box ref={listRef} sx={{ minHeight: 0, overflowY: 'auto', pb: 1 }}>
          {rows.length === 0 && (
            <Typography sx={{ color: t.text.secondary, px: 2, py: 4, textAlign: 'center' }}>
              No market matches "{query}".
            </Typography>
          )}
          {rows.map((p, i) => {
            const key = keyOf(p);
            const isSel = selected ? keyOf(selected) === key : false;
            const isCur = i === cursor;
            return (
              <Box
                key={key}
                data-index={i}
                onMouseEnter={() => setCursor(i)}
                sx={{
                  [REDUCED]: { transition: 'none' },
                  alignItems: 'center',
                  bgcolor: isCur ? t.surface.hover : 'transparent',
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: '28px minmax(0,1fr) 120px 120px',
                  mx: 1,
                  px: 1,
                  transition: `background-color ${T_FAST}`,
                }}
              >
                <IconButton
                  aria-label={favs.has(key) ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => toggleFav(key)}
                  size="small"
                  sx={{ color: favs.has(key) ? t.accent.primary : t.text.tertiary, p: 0.25 }}
                >
                  {favs.has(key) ? (
                    <Star sx={{ fontSize: 16 }} />
                  ) : (
                    <StarBorder sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                <ButtonBase
                  onClick={() => choose(p)}
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 1.25,
                    justifyContent: 'flex-start',
                    minWidth: 0,
                    py: 1.25,
                    textAlign: 'left',
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      alignItems: 'center',
                      bgcolor: t.accent.muted,
                      borderRadius: '50%',
                      color: t.accent.primary,
                      display: 'flex',
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      height: 28,
                      justifyContent: 'center',
                      width: 28,
                    }}
                  >
                    {baseOf(p).slice(0, 2).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>
                      {baseOf(p)}
                      <Box component="span" sx={{ color: t.text.tertiary, fontWeight: 500 }}>
                        {' / '}
                        {quoteOf(p)}
                      </Box>
                      {isSel && (
                        <Box
                          component="span"
                          sx={{
                            bgcolor: t.accent.muted,
                            borderRadius: '6px',
                            color: t.accent.primary,
                            fontSize: 10,
                            fontWeight: 700,
                            ml: 1,
                            px: 0.75,
                            py: 0.25,
                            verticalAlign: 'middle',
                          }}
                        >
                          OPEN
                        </Box>
                      )}
                    </Typography>
                    <Typography
                      sx={{ ...NUM, color: t.text.tertiary, fontSize: 11, lineHeight: 1.3 }}
                      noWrap
                    >
                      {p.amountAsset === 'DCC' ? 'native' : `${p.amountAsset.slice(0, 10)}…`}
                    </Typography>
                  </Box>
                </ButtonBase>
                <Typography
                  sx={{ ...NUM, color: t.text.tertiary, fontSize: 13, textAlign: 'right' }}
                >
                  —
                </Typography>
                <Typography
                  sx={{ ...NUM, color: t.text.tertiary, fontSize: 13, textAlign: 'right' }}
                >
                  —
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            alignItems: 'center',
            borderTop: `1px solid ${t.border.subtle}`,
            color: t.text.tertiary,
            display: 'flex',
            fontSize: 12,
            gap: 2,
            justifyContent: 'space-between',
            px: 2,
            py: 1,
          }}
        >
          <span>
            {rows.length} market{rows.length === 1 ? '' : 's'}
          </span>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {(
              [
                ['↑↓', 'navigate'],
                ['↵', 'open'],
                ['esc', 'close'],
              ] as const
            ).map(([k, l]) => (
              <Box key={k} sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}>
                <Box
                  component="kbd"
                  sx={{
                    ...NUM,
                    bgcolor: t.surface.sunken,
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: '5px',
                    fontSize: 11,
                    lineHeight: 1,
                    px: 0.6,
                    py: 0.35,
                  }}
                >
                  {k}
                </Box>
                <span>{l}</span>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
