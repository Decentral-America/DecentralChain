/**
 * Order Book Page
 * Shows live order book and market depth
 */
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';

export const OrderBook = () => {
  const buyOrders = [
    { price: '135.20', amount: '150.5', total: '20,347.60' },
    { price: '135.18', amount: '220.3', total: '29,776.05' },
    { price: '135.15', amount: '95.8', total: '12,945.37' },
    { price: '135.10', amount: '340.2', total: '45,960.02' },
    { price: '135.05', amount: '180.7', total: '24,404.04' },
  ];

  const sellOrders = [
    { price: '135.25', amount: '180.3', total: '24,390.58' },
    { price: '135.28', amount: '95.2', total: '12,878.66' },
    { price: '135.30', amount: '240.5', total: '32,539.65' },
    { price: '135.35', amount: '120.8', total: '16,350.28' },
    { price: '135.40', amount: '310.2', total: '42,001.08' },
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
        <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid #EEF2F7' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: 'error.main' }}>
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
            {sellOrders.map((order, idx) => (
              <Stack
                key={idx}
                direction="row"
                justifyContent="space-between"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#FEF2F2' },
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
        <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid #EEF2F7' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: 'success.main' }}>
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
            {buyOrders.map((order, idx) => (
              <Stack
                key={idx}
                direction="row"
                justifyContent="space-between"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#F0FDF4' },
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
