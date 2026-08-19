/**
 * Order Book Page
 * Shows live order book and market depth
 */
import { Chip, Paper, Stack, Typography, useTheme } from '@mui/material';
import { PageFrame } from '@/layouts/PageFrame';
import { tokens } from '@/theme/tokens/semantic';

export const OrderBook = () => {
  const t = tokens(useTheme().palette.mode);
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
      title="Order Book"
      subtitle="Live order book and market depth."
      actions={<Chip label="DCC/USDT" color="primary" />}
    >
      <Stack direction="row" spacing={2}>
        {/* Sell Orders */}
        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1, p: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'error.main',
              fontWeight: 700,
              mb: 2,
            }}
          >
            Sell Orders
          </Typography>
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Price
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Amount
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Total
              </Typography>
            </Stack>
            {sellOrders.map((order) => (
              <Stack
                key={order.price}
                direction="row"
                sx={{
                  /*
                   * `status.dangerSurface`/`successSurface` are entries in a
                   * flat table with no mode dimension, so tinting the hover
                   * with them put a fixed near-white fill under this row's
                   * mode-aware ink: 1.0131:1 in dark on the sell side,
                   * 1.0001:1 on the buy side — pointing at a row erased it.
                   * The side is already stated by the price cell's own
                   * `error.main`/`success.main`; the hover only needs to say
                   * "this row".
                   *
                   * `surface.sunken` rather than `action.hover`: the row is a
                   * well inside a raised `Paper`, and `surface.hover` is a
                   * heavy enough step in light mode that `intent.success`
                   * lands at 4.29:1 on it. On `sunken` both intents clear —
                   * 4.60/4.84 light, 11.36/7.23 dark.
                   */
                  '&:hover': { bgcolor: t.surface.sunken },
                  borderRadius: 1,
                  justifyContent: 'space-between',
                  p: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {order.price}
                </Typography>
                <Typography variant="body2">{order.amount}</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {order.total}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* Buy Orders */}
        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1, p: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'success.main',
              fontWeight: 700,
              mb: 2,
            }}
          >
            Buy Orders
          </Typography>
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Price
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Amount
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Total
              </Typography>
            </Stack>
            {buyOrders.map((order) => (
              <Stack
                key={order.price}
                direction="row"
                sx={{
                  // Mode-aware, for the reason given on the sell side above.
                  '&:hover': { bgcolor: t.surface.sunken },
                  borderRadius: 1,
                  justifyContent: 'space-between',
                  p: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'success.main',
                    fontWeight: 600,
                  }}
                >
                  {order.price}
                </Typography>
                <Typography variant="body2">{order.amount}</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {order.total}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </PageFrame>
  );
};
