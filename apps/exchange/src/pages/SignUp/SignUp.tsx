/**
 * SignUp Page
 * Full-screen mobile-app experience on mobile, 2-column layout on desktop.
 */

import LoginIcon from '@mui/icons-material/Login';
import ShieldIcon from '@mui/icons-material/Shield';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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
import { CreateAccount } from '@/features/auth/CreateAccount';
import { landingTheme } from '@/theme/landingTheme';

const SignUpInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* ─── MOBILE: full-screen app-like shell ─── */
  if (isMobile) {
    return (
      <MobileAuthShell actionLabel="Sign In" actionRoute="/sign-in">
        <CreateAccount />
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
                Start your trading journey today
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18, mb: 4 }}>
                Create your decentralized wallet and get instant access to trading and portfolio
                management.
              </Typography>

              <Button
                variant="outlined"
                size="large"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/sign-in')}
                sx={{
                  '&:hover': { bgcolor: 'primary.main', borderWidth: 2, color: 'white' },
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 4,
                }}
              >
                Already have an account? Sign In
              </Button>

              <Stack spacing={2.5}>
                {[
                  {
                    color: 'primary.main',
                    desc: 'You control your private keys. Your crypto, your rules.',
                    icon: <ShieldIcon sx={{ fontSize: 20 }} />,
                    title: 'Non-Custodial Security',
                  },
                  {
                    color: 'secondary.main',
                    desc: 'Smart routing algorithms find you the best rates across liquidity pools.',
                    icon: <SwapHorizIcon sx={{ fontSize: 20 }} />,
                    title: 'Instant Token Swaps',
                  },
                  {
                    color: 'primary.main',
                    desc: 'Professional charts, portfolio tracking, and market insights.',
                    icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
                    title: 'Real-Time Analytics',
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

          {/* Right Column - Account Creation Form */}
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
                <CreateAccount />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export const SignUp: React.FC = () => (
  <ThemeProvider theme={landingTheme}>
    <SignUpInner />
  </ThemeProvider>
);
