import { Box, Button, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { ctaGradientStyles } from '../../theme/landingTheme';

export default function BigCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            borderRadius: 3,
            p: { xs: 6, md: 10 },
            textAlign: 'center',
            color: '#fff',
            ...ctaGradientStyles,
            boxShadow: '0 30px 80px rgba(15,25,55,.20)',
          }}
        >
          <Typography variant="h2" fontWeight={800} sx={{ mb: 3 }}>
            Start trading on Decentral.Exchange
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.95, maxWidth: 600, mx: 'auto' }}>
            Experience the future of decentralized trading with secure swaps, advanced trading
            tools, and complete control over your assets.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/create-account')}
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1.5,
              bgcolor: '#fff',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Create Your Wallet Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
