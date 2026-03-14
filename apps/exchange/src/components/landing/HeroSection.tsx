import { Box, Container, Grid, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { heroGradientStyles } from '@/theme/landingTheme';

/**
 * Hero section with gradient background and floating mockups
 */
export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 14, md: 18 },
        pb: { xs: 10, md: 11 },
        color: '#fff',
        minHeight: { xs: '85vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Hero Gradient Background */}
      <Box sx={heroGradientStyles} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Column - Text Content */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 40, sm: 48, md: 56 },
                lineHeight: 1.12,
                fontWeight: 700,
                letterSpacing: '-0.5px',
                mb: 3,
              }}
            >
              DecentralChain Wallet
              <br />
              & DEX Platform
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 420,
                opacity: 0.95,
                fontSize: { xs: 16, md: 18 },
                lineHeight: 1.6,
              }}
            >
              Secure non-custodial wallet with integrated DEX trading, staking, leasing, and hardware wallet support. Trade on DecentralChain blockchain with complete control of your assets.
            </Typography>

            {/* CTA Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/create-account')}
                sx={{
                  borderRadius: 999,
                  px: 3,
                  py: 1.5,
                  bgcolor: 'primary.main',
                  fontSize: 16,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Start Trading Now
              </Button>

              {/* Create Wallet Button */}
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/create-account')}
                sx={{
                  borderRadius: 999,
                  px: 3,
                  py: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Create Wallet
              </Button>
            </Stack>

            {/* Login Link */}
            <Box sx={{ mt: 3 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/sign-in')}
                sx={{
                  opacity: 0.85,
                  '&:hover': {
                    opacity: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Already have a wallet? Sign in →
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Mockup Visuals */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                height: { xs: 360, sm: 420, md: 520 },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {/* Dashboard Mockup (background) */}
              <Box
                sx={{
                  position: 'absolute',
                  right: { xs: -20, md: 0 },
                  top: { xs: 40, md: 20 },
                  width: { xs: '90%', md: '100%' },
                  maxWidth: 520,
                  height: { xs: 280, md: 360 },
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 30px 80px rgba(0,0,0,.25)',
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </Box>

              {/* Phone Mockup (foreground) */}
              <Box
                sx={{
                  position: 'absolute',
                  left: { xs: 10, md: 40 },
                  top: { xs: -10, md: -20 },
                  width: { xs: 140, md: 200 },
                  height: { xs: 280, md: 400 },
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,.30)',
                  p: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
