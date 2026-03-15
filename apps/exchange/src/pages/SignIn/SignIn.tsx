/**
 * SignIn Page
 * Full-screen mobile-app experience on mobile, 2-column layout on desktop.
 */

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileAuthShell } from '@/components/layout/MobileAuthShell';
import { LoginForm } from '@/features/auth/LoginForm';
import { landingTheme } from '@/theme/landingTheme';

const SignInInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* ─── MOBILE: full-screen app-like shell ─── */
  if (isMobile) {
    return (
      <MobileAuthShell
        actionLabel="Create Wallet"
        actionRoute="/create-account"
        secondaryActionLabel="Import"
        secondaryActionRoute="/import-account"
      >
        <LoginForm />
      </MobileAuthShell>
    );
  }

  /* ─── DESKTOP: 2-column layout ─── */
  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Column - Branding & Features */}
          <Grid
            size={{
              md: 5,
            }}
          >
            <Box sx={{ pr: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Box
                  component="img"
                  src="/assets/decentralexchange.svg"
                  alt="Decentral Exchange"
                  sx={{ height: 40, width: 'auto' }}
                />
              </Box>

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{ fontSize: '2.5rem', lineHeight: 1.2, mb: 2 }}
              >
                Welcome back to the future of trading
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18, mb: 4 }}>
                Sign in to access your decentralized exchange account and continue trading securely.
              </Typography>

              <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={() => navigate('/create-account')}
                  sx={{
                    '&:hover': { bgcolor: 'primary.main', borderWidth: 2, color: 'white' },
                    borderColor: 'primary.main',
                    borderWidth: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                  }}
                >
                  Still don&apos;t have a wallet? Create Account
                </Button>

                <Button
                  variant="text"
                  size="large"
                  onClick={() => navigate('/import-account')}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  Import Existing Wallet →
                </Button>
              </Stack>

              <Stack spacing={2.5}>
                {[
                  {
                    color: 'primary.main',
                    desc: 'Your keys, your crypto. Non-custodial wallet protection.',
                    icon: <SecurityIcon sx={{ fontSize: 20 }} />,
                    title: 'Bank-grade Security',
                  },
                  {
                    color: 'secondary.main',
                    desc: 'Execute trades in seconds with our optimized infrastructure.',
                    icon: <SpeedIcon sx={{ fontSize: 20 }} />,
                    title: 'Lightning Fast',
                  },
                  {
                    color: 'primary.main',
                    desc: 'Professional charts, real-time analytics, and smart routing.',
                    icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
                    title: 'Advanced Trading Tools',
                  },
                ].map((f) => (
                  <Stack key={f.title} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: f.color,
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        flexShrink: 0,
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {f.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {f.desc}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right Column - Login Form */}
          <Grid
            size={{
              md: 7,
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                background: `
                  radial-gradient(1200px 600px at 20% -10%, #FF7A59 0%, rgba(255,122,89,0) 60%),
                  radial-gradient(900px 500px at 70% 0%, #5B8CFF 0%, rgba(91,140,255,0) 60%),
                  radial-gradient(800px 400px at 40% 30%, #9D4EDD 0%, rgba(157,78,221,0) 60%),
                  linear-gradient(180deg, #0A0E1A 0%, #111827 100%)
                `,
                borderRadius: 3,
                display: 'flex',
                filter: 'saturate(1.05)',
                justifyContent: 'center',
                minHeight: '600px',
                overflow: 'hidden',
                padding: 5,
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  backdropFilter: 'blur(10px)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 2.5,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  p: 4,
                  position: 'relative',
                  width: '100%',
                  zIndex: 1,
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
  );
};

export const SignIn: React.FC = () => (
  <ThemeProvider theme={landingTheme}>
    <SignInInner />
  </ThemeProvider>
);
