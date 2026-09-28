/**
 * Order Book Page
 * Shows live order book and market depth.
 *
 * Not wired to the matcher yet: the levels below are the page's existing
 * sample rows, held inert under the notice. Trade carries the real book.
 */
import { Card, Chip, Stack, Typography, useTheme } from '@mui/material';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { PageFrame } from '@/layouts/PageFrame';
import { tokens } from '@/theme/tokens/semantic';

interface SampleLevel {
  amount: string;
  price: string;
  total: string;
}

/** One side of the sample book: a heading, the column labels, then the levels. */
function BookSide({
  levels,
  side,
  title,
}: {
  levels: SampleLevel[];
  side: 'buy' | 'sell';
  title: string;
}) {
  const t = tokens(useTheme().palette.mode);
  const ink = side === 'sell' ? 'error.main' : 'success.main';

  return (
    <Card sx={{ flex: 1, p: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{ color: ink, fontWeight: 600, letterSpacing: '-0.01em', mb: 1.5 }}
      >
        {title}
      </Typography>
      <Stack spacing={0.25}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5, px: 1 }}>
          {['Price', 'Amount', 'Total'].map((label) => (
            <Typography
              key={label}
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              {label}
            </Typography>
          ))}
        </Stack>
        {levels.map((order) => (
          <Stack
            key={order.price}
            direction="row"
            sx={{
              /*
               * `status.dangerSurface`/`successSurface` are entries in a flat
               * table with no mode dimension, so tinting the hover with them
               * put a fixed near-white fill under this row's mode-aware ink:
               * 1.0131:1 in dark on the sell side, 1.0001:1 on the buy side —
               * pointing at a row erased it. The side is already stated by the
               * price cell's own `error.main`/`success.main`; the hover only
               * needs to say "this row".
               *
               * `surface.sunken` rather than `action.hover`: the row is a well
               * inside a raised card, and `surface.hover` is a heavy enough
               * step in light mode that `intent.success` lands at 4.29:1 on
               * it. On `sunken` both intents clear — 4.60/4.84 light,
               * 11.36/7.23 dark.
               */
              '&:hover': { bgcolor: t.surface.sunken },
              borderRadius: 1,
              fontVariantNumeric: 'tabular-nums',
              justifyContent: 'space-between',
              px: 1,
              py: 0.5,
            }}
          >
            <Typography variant="body2" sx={{ color: ink, fontWeight: 500 }}>
              {order.price}
            </Typography>
            <Typography variant="body2">{order.amount}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {order.total}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export const OrderBook = () => {
  const buyOrders = [
    { amount: '150.5', price: '135.20', total: '20,347.60' },
    { amount: '220.3', price: '135.18', total: '29,776.05' },
    { amount: '95.8', price: '135.15', total: '12,945.37' },
    { amount: '340.2', price: '135.10', total: '45,960.02' },
    { amount: '180.7', price: '135.05', total: '24,404.04' },
  ];

  const sellOrders = [
    { amount: '180.3', price: '135.25', total: '24,390.58' },
    { amount: '95.2', price: '135.28', total: '12,878.66' },
    { amount: '240.5', price: '135.30', total: '32,539.65' },
    { amount: '120.8', price: '135.35', total: '16,350.28' },
    { amount: '310.2', price: '135.40', total: '42,001.08' },
  ];

  return (
    <PageFrame
      title="Order book"
      subtitle="Live order book and market depth."
      actions={<Chip label="DCC/USDT" />}
    >
      <ComingSoon
        title="This order book is a placeholder"
        description="The rows below are sample data. Trade carries the real order book, streamed from the matcher for the pair you select there."
      >
        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
          <BookSide side="sell" title="Sell Orders" levels={sellOrders} />
          <BookSide side="buy" title="Buy Orders" levels={buyOrders} />
        </Stack>
      </ComingSoon>
    </PageFrame>
  );
};
