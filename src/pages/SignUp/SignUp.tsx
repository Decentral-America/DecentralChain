/**
 * SignUp Page
 * Modern account creation page with 2-column layout matching landing page theme
 */
import React from 'react';
import { Box, Container, Grid, Typography, Stack, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { landingTheme } from '@/theme/landingTheme';
import { CreateAccount } from '@/features/auth/CreateAccount';
import ShieldIcon from '@mui/icons-material/Shield';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LoginIcon from '@mui/icons-material/Login';

export const SignUp: React.FC = () => {
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
                  Start your trading journey today
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: 18 }}>
                  Create your decentralized wallet and get instant access to trading, swaps, and
                  portfolio management.
                </Typography>

                {/* Already have account button */}
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/sign-in')}
                  sx={{
                    mb: 4,
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
                  Already have an account? Sign In
                </Button>

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
                      <ShieldIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Non-Custodial Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        You control your private keys. Your crypto, your rules.
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
                      <SwapHorizIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Instant Token Swaps
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Smart routing algorithms find you the best rates across liquidity pools.
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
                      <ShowChartIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Real-Time Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Professional charts, portfolio tracking, and market insights.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            {/* Right Column - Account Creation Form */}
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
                  <CreateAccount />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
