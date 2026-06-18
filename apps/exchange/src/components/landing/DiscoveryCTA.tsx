import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function DiscoveryCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 10, xs: 8 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
          Your gateway to decentralized finance
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', maxWidth: 480, mb: 4, mx: 'auto' }}
        >
          Join thousands of traders who trust DecentralExchange for secure, fast, and decentralized
          trading.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ borderRadius: 999, px: 3 }}
          onClick={() => navigate('/create-account')}
        >
          Get Started
        </Button>
      </Container>
    </Box>
  );
}
