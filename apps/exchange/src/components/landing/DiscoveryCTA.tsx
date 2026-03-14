import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function DiscoveryCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
            <Box
              sx={{
                maxWidth: 340,
                height: 400,
                bgcolor: 'rgba(79, 70, 229, 0.05)',
                borderRadius: 3,
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400)',
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
                  bgcolor: 'rgba(255, 255, 255, 0.75)',
                  borderRadius: 3,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
            <Typography variant="h2" sx={{ mb: 3, fontWeight: 700 }}>
              Your gateway to decentralized finance
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of traders who trust Decentral.Exchange for secure, fast, and
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
