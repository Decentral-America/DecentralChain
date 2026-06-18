import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PricingFinder() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 12, xs: 10 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.12 }}
        >
          SWAP TOKENS INSTANTLY
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 3, mt: 2 }}>
          Best rates, zero hassle
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', maxWidth: 560, mb: 4, mx: 'auto' }}
        >
          Our smart routing algorithm automatically finds the best prices across multiple liquidity
          pools to get you the optimal rate for every swap.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ borderRadius: 999, px: 3 }}
          onClick={() => navigate('/desktop/dex')}
        >
          Start Swapping
        </Button>
      </Container>
    </Box>
  );
}
