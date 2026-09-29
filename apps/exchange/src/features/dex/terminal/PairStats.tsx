import { Box, Typography, useTheme } from '@mui/material';
import { selectMarketData, selectSelectedPair, useDexStore } from '@/stores/dexStore';
import { tokens } from '@/theme/tokens/semantic';
import { direction, NUM } from './terminalTokens';

const fmt = (v: number, max = 8) =>
  v === 0
    ? '—'
    : v.toLocaleString('en-US', { maximumFractionDigits: max, minimumFractionDigits: 0 });

/**
 * Last price and the 24h line, beside the symbol.
 *
 * The price is the one number on the toolbar set in a heavier weight and the
 * direction colour; the rest is secondary and mono so it lines up as it ticks.
 */
export function PairStats() {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const dir = direction(theme);
  const m = useDexStore(selectMarketData);
  const pair = useDexStore(selectSelectedPair);
  const quote = pair?.priceAssetName || pair?.priceAsset || '';
  const pct = m.priceChangePercent24h;
  const up = pct >= 0;
  const tone = pct === 0 ? t.text.secondary : up ? dir.up : dir.down;

  return (
    <Box
      sx={{
        alignItems: 'baseline',
        display: 'flex',
        flexShrink: 0,
        gap: { xl: 1.75, xs: 1.25 },
        minWidth: 0,
      }}
    >
      <Typography component="span" sx={{ ...NUM, color: tone, fontSize: 15, fontWeight: 600 }}>
        {fmt(m.currentPrice)}
        {/* With no trade in 24h the store falls back to the book's mid — say so
            rather than let a mid read as a last. */}
        {m.currentPrice > 0 && !(m.lastPrice > 0) && (
          <Box
            component="span"
            sx={{
              color: t.text.tertiary,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.08em',
              ml: 0.6,
              verticalAlign: 'middle',
            }}
          >
            MID
          </Box>
        )}
      </Typography>
      <Typography component="span" sx={{ ...NUM, color: tone, fontSize: 12, fontWeight: 500 }}>
        {pct === 0 ? '0.00%' : `${up ? '+' : ''}${pct.toFixed(2)}%`}
      </Typography>
      {(
        [
          ['24h High', m.high24h],
          ['24h Low', m.low24h],
          ['24h Vol', m.volume24h],
        ] as const
      ).map(([label, v]) => (
        <Box
          key={label}
          sx={{ display: { xl: 'flex', xs: 'none' }, flexDirection: 'column', lineHeight: 1.1 }}
        >
          <Typography
            component="span"
            sx={{
              color: t.text.tertiary,
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Typography>
          <Typography component="span" sx={{ ...NUM, color: t.text.secondary, fontSize: 12 }}>
            {fmt(v, 4)}
            {label === '24h Vol' && v !== 0 ? ` ${quote}` : ''}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
