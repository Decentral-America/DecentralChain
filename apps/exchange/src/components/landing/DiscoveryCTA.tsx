import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function DiscoveryCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 10, xs: 8 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid
            order={{ md: 1, xs: 2 }}
            size={{
              md: 6,
              xs: 12,
            }}
          >
            <Box
              sx={{
                '&::before': {
                  bgcolor: 'rgba(255, 255, 255, 0.75)',
                  borderRadius: 3,
                  bottom: 0,
                  content: '""',
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                },
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                bgcolor: 'rgba(79, 70, 229, 0.05)',
                borderRadius: 3,
                height: 400,
                maxWidth: 340,
                position: 'relative',
              }}
            />
          </Grid>
          <Grid
            order={{ md: 2, xs: 1 }}
            size={{
              md: 6,
              xs: 12,
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
              Your gateway to decentralized finance
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of traders who trust DecentralExchange for secure, fast, and
              decentralized trading.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ borderRadius: 999, px: 3 }}
              onClick={() => navigate('/create-account')}
            >
              Get Started
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
