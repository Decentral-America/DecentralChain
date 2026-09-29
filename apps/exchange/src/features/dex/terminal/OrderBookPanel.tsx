import { Box, Typography, useTheme } from '@mui/material';
import { OrderBook } from '@/features/dex/OrderBook';
import { selectOrderBook, useDexStore } from '@/stores/dexStore';
import { tokens } from '@/theme/tokens/semantic';
import { direction, MONO, NUM } from './terminalTokens';

/** The book, with its spread in the header where the eye lands first. */
export function OrderBookPanel() {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const dir = direction(theme);
  const book = useDexStore(selectOrderBook);
  const ask = parseFloat(book.asks[0]?.price ?? '0');
  const bid = parseFloat(book.bids[0]?.price ?? '0');
  const spread = ask > 0 && bid > 0 ? ((ask - bid) / bid) * 100 : null;

  return (
    <Box
      style={
        {
          '--dir-down': dir.down,
          '--dir-up': dir.up,
          '--mono': MONO,
        } as React.CSSProperties
      }
      sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}
    >
      <Box
        sx={{
          alignItems: 'center',
          borderBottom: `1px solid ${t.border.subtle}`,
          display: 'flex',
          flexShrink: 0,
          height: 40,
          justifyContent: 'space-between',
          px: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>
          Order book
        </Typography>
        <Typography sx={{ ...NUM, color: t.text.tertiary, fontSize: 11 }}>
          {spread === null ? 'Spread —' : `Spread ${spread.toFixed(2)}%`}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <OrderBook />
      </Box>
    </Box>
  );
}
