import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PricingFinder() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 12, xs: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ md: 6, xs: 12 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.12 }}
            >
              SWAP TOKENS INSTANTLY
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3, mt: 2 }}>
              Best rates, zero hassle
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              Our smart routing algorithm automatically finds the best prices across multiple
              liquidity pools to get you the optimal rate for every swap.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ borderRadius: 999, px: 3 }}
              onClick={() => navigate('/desktop/dex')}
            >
              Start Swapping
            </Button>
          </Grid>
          <Grid size={{ md: 6, xs: 12 }}>
            <Box
              component="img"
              src="/images/landing-swap.jpg"
              alt="Token swap interface"
              sx={{
                border: '1px solid #E9EEF5',
                borderRadius: 6,
                boxShadow: 4,
                display: 'block',
                height: 420,
                maxWidth: 340,
                mx: 'auto',
                objectFit: 'cover',
                width: '100%',
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
