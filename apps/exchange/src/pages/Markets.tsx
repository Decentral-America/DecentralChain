/**
 * Markets Page
 * Shows cryptocurrency market overview and price charts
 */
import { Box, Typography, Paper, Grid, Stack } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export const Markets = () => {
  const marketData = [
    { pair: 'DCC/USDT', price: '135.22', change: '+2.19%', volume: '1.2M', positive: true },
    { pair: 'BTC/USDT', price: '42,567.10', change: '+1.85%', volume: '15.3M', positive: true },
    { pair: 'ETH/USDT', price: '2,895.40', change: '-0.45%', volume: '8.7M', positive: false },
    { pair: 'DCC/BTC', price: '0.00317', change: '+0.34%', volume: '450K', positive: true },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Markets
      </Typography>

      <Grid container spacing={3}>
        {marketData.map((market) => (
          <Grid item xs={12} sm={6} md={3} key={market.pair}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid #EEF2F7',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(61, 38, 190, 0.15)',
                },
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {market.pair}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ${market.price}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {market.positive ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={market.positive ? 'success.main' : 'error.main'}
                  >
                    {market.change}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Vol: {market.volume}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
