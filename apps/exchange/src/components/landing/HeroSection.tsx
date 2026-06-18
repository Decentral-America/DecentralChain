import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
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
        alignItems: 'center',
        color: '#fff',
        display: 'flex',
        minHeight: { md: '90vh', xs: '85vh' },
        overflow: 'hidden',
        pb: { md: 11, xs: 10 },
        position: 'relative',
        pt: { md: 18, xs: 14 },
      }}
    >
      {/* Hero Gradient Background */}
      <Box sx={heroGradientStyles} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          {/* Text Content */}
          <Grid size={{ md: 6, xs: 12 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { md: 56, sm: 48, xs: 40 },
                fontWeight: 700,
                letterSpacing: '-0.5px',
                lineHeight: 1.12,
                mb: 3,
              }}
            >
              DecentralChain Wallet
              <br />& DEX Platform
            </Typography>

            <Typography
              sx={{
                fontSize: { md: 18, xs: 16 },
                lineHeight: 1.6,
                maxWidth: 420,
                mt: 3,
                opacity: 0.95,
              }}
            >
              Secure non-custodial wallet with integrated DEX trading, staking, leasing, and
              hardware wallet support. Trade on DecentralChain blockchain with complete control of
              your assets.
            </Typography>

            {/* CTA Buttons */}
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/create-account')}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  bgcolor: 'primary.main',
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 500,
                  px: 3,
                  py: 1.5,
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
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#fff',
                  },
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: 999,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  px: 3,
                  py: 1.5,
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
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    opacity: 1,
                  },
                  opacity: 0.85,
                }}
              >
                Already have a wallet? Sign in →
              </Button>
            </Box>
          </Grid>

          {/* Right Column — Hero Image */}
          <Grid size={{ md: 6, xs: 12 }} sx={{ display: { sm: 'block', xs: 'none' } }}>
            <Box
              component="img"
              src="/images/landing-hero-phone.jpg"
              alt="DecentralChain trading app"
              sx={{
                borderRadius: 4,
                boxShadow: '0 30px 80px rgba(0,0,0,.35)',
                display: 'block',
                height: { md: 420, sm: 340 },
                ml: 'auto',
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
