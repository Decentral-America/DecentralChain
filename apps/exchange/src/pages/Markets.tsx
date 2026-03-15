/**
 * Markets Page
 * Shows cryptocurrency market overview and price charts
 */

import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

export const Markets = () => {
  const marketData = [
    { change: '+2.19%', pair: 'DCC/USDT', positive: true, price: '135.22', volume: '1.2M' },
    { change: '+1.85%', pair: 'BTC/USDT', positive: true, price: '42,567.10', volume: '15.3M' },
    { change: '-0.45%', pair: 'ETH/USDT', positive: false, price: '2,895.40', volume: '8.7M' },
    { change: '+0.34%', pair: 'DCC/BTC', positive: true, price: '0.00317', volume: '450K' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Markets
      </Typography>
      <Grid container spacing={3}>
        {marketData.map((market) => (
          <Grid
            key={market.pair}
            size={{
              md: 3,
              sm: 6,
              xs: 12,
            }}
          >
            <Paper
              sx={{
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(61, 38, 190, 0.15)',
                },
                border: '1px solid #EEF2F7',
                borderRadius: 2,
                cursor: 'pointer',
                p: 2.5,
                transition: 'all 0.2s',
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
                    <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
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
