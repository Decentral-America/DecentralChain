/**
 * SignIn Page
 * Modern authentication page with 2-column layout matching landing page theme
 */
import React from 'react';
import { Box, Container, Grid, Typography, Stack, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { landingTheme } from '@/theme/landingTheme';
import { LoginForm } from '@/features/auth/LoginForm';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const SignIn: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 5, md: 8 } }}>
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
            {/* Left Column - Branding & Features */}
            <Grid item xs={12} md={5}>
              <Box sx={{ pr: { md: 4 } }}>
                {/* Logo/Title */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    component="img"
                    src="/assets/decentralexchange.svg"
                    alt="Decentral Exchange"
                    sx={{
                      height: 40,
                      width: 'auto',
                    }}
                  />
                </Box>

                {/* Headline */}
                <Typography
                  variant="h2"
                  fontWeight={800}
                  sx={{
                    mb: 2,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Welcome back to the future of trading
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: 18 }}>
                  Sign in to access your decentralized exchange account and continue trading
                  securely.
                </Typography>

                {/* Create account and Import wallet buttons */}
                <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => navigate('/create-account')}
                    sx={{
                      borderWidth: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                      },
                    }}
                  >
                    Still don&apos;t have a wallet? Create Account
                  </Button>

                  <Button
                    variant="text"
                    size="large"
                    onClick={() => navigate('/import-account')}
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    Import Existing Wallet →
                  </Button>
                </Stack>

                {/* Feature highlights */}
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Bank-grade Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your keys, your crypto. Non-custodial wallet protection.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <SpeedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Lightning Fast
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Execute trades in seconds with our optimized infrastructure.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Advanced Trading Tools
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Professional charts, real-time analytics, and smart routing.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            {/* Right Column - Login Form */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 3,
                  overflow: 'hidden',
                  minHeight: { xs: 'auto', md: '600px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: { xs: 2, sm: 3, md: 5 },
                  // Apply gradient background directly
                  background: `
                    radial-gradient(1200px 600px at 20% -10%, #FF7A59 0%, rgba(255,122,89,0) 60%),
                    radial-gradient(900px 500px at 70% 0%, #5B8CFF 0%, rgba(91,140,255,0) 60%),
                    radial-gradient(800px 400px at 40% 30%, #9D4EDD 0%, rgba(157,78,221,0) 60%),
                    linear-gradient(180deg, #0A0E1A 0%, #111827 100%)
                  `,
                  filter: 'saturate(1.05)',
                }}
              >
                {/* Form content */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2.5,
                    p: { xs: 3, md: 4 },
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <LoginForm />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
