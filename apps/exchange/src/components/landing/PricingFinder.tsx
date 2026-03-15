import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PricingFinder() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 12, xs: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid
            size={{
              md: 6,
              xs: 12,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.12 }}
            >
              SWAP TOKENS INSTANTLY
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3, mt: 2 }}>
              Best rates, zero hassle
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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
          <Grid
            size={{
              md: 6,
              xs: 12,
            }}
          >
            <Box
              sx={{
                '&::before': {
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 6,
                  bottom: 0,
                  content: '""',
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                },
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                bgcolor: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid #E9EEF5',
                borderRadius: 6,
                boxShadow: 4,
                height: 420,
                maxWidth: 340,
                mx: 'auto',
                position: 'relative',
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
