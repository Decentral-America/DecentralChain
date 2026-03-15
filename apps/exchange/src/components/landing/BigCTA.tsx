import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ctaGradientStyles } from '../../theme/landingTheme';

export default function BigCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 12, xs: 8 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            borderRadius: 3,
            color: '#fff',
            p: { md: 10, xs: 6 },
            textAlign: 'center',
            ...ctaGradientStyles,
            boxShadow: '0 30px 80px rgba(15,25,55,.20)',
          }}
        >
          <Typography variant="h2" fontWeight={800} sx={{ mb: 3 }}>
            Start trading on DecentralExchange
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 600, mb: 4, mx: 'auto', opacity: 0.95 }}>
            Experience the future of decentralized trading with secure swaps, advanced trading
            tools, and complete control over your assets.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/create-account')}
            endIcon={<ArrowForwardIcon />}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
              bgcolor: '#fff',
              borderRadius: 999,
              color: 'primary.main',
              px: 3,
              py: 1.5,
            }}
          >
            Create Your Wallet Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
