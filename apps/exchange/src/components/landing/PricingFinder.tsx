import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PricingFinder() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 10, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.12 }}
            >
              SWAP TOKENS INSTANTLY
            </Typography>
            <Typography variant="h2" sx={{ mt: 2, mb: 3, fontWeight: 700 }}>
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
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                maxWidth: 340,
                mx: 'auto',
                height: 420,
                borderRadius: 6,
                bgcolor: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid #E9EEF5',
                boxShadow: 4,
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 6,
                },
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
