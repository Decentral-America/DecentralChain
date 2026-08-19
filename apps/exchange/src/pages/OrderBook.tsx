/**
 * Order Book Page
 * Shows live order book and market depth
 */
import { Chip, Paper, Stack, Typography } from '@mui/material';
import { PageFrame } from '@/layouts/PageFrame';
import { status } from '@/styles/tokens';

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
                  '&:hover': { bgcolor: status.dangerSurface },
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
                  '&:hover': { bgcolor: status.successSurface },
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
