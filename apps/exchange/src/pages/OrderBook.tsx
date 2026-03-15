/**
 * Order Book Page
 * Shows live order book and market depth
 */
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

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
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Order Book
        </Typography>
        <Chip label="DCC/USDT" color="primary" />
      </Stack>

      <Stack direction="row" spacing={2}>
        {/* Sell Orders */}
        <Paper sx={{ border: '1px solid #EEF2F7', borderRadius: 2, flex: 1, p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'error.main', mb: 2 }}>
            Sell Orders
          </Typography>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Price
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Amount
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total
              </Typography>
            </Stack>
            {sellOrders.map((order) => (
              <Stack
                key={order.price}
                direction="row"
                justifyContent="space-between"
                sx={{
                  '&:hover': { bgcolor: '#FEF2F2' },
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Typography variant="body2" color="error.main" fontWeight={600}>
                  {order.price}
                </Typography>
                <Typography variant="body2">{order.amount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.total}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* Buy Orders */}
        <Paper sx={{ border: '1px solid #EEF2F7', borderRadius: 2, flex: 1, p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'success.main', mb: 2 }}>
            Buy Orders
          </Typography>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Price
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Amount
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total
              </Typography>
            </Stack>
            {buyOrders.map((order) => (
              <Stack
                key={order.price}
                direction="row"
                justifyContent="space-between"
                sx={{
                  '&:hover': { bgcolor: '#F0FDF4' },
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  {order.price}
                </Typography>
                <Typography variant="body2">{order.amount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.total}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};
