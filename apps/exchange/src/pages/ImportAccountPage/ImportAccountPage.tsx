/**
 * ImportAccountPage
 * Full-screen mobile-app experience on mobile, 2-column layout on desktop.
 */
import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { landingTheme } from '@/theme/landingTheme';
import { ImportAccount } from '@/features/auth/ImportAccount';
import { MobileAuthShell } from '@/components/layout/MobileAuthShell';
import ShieldIcon from '@mui/icons-material/Shield';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LoginIcon from '@mui/icons-material/Login';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const ImportAccountInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* ─── MOBILE: full-screen app-like shell ─── */
  if (isMobile) {
    return (
      <MobileAuthShell actionLabel="Sign In" actionRoute="/sign-in">
        <ImportAccount />
      </MobileAuthShell>
    );
  }

  /* ─── DESKTOP: 2-column layout ─── */
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Column - Branding & Features */}
          <Grid item md={5}>
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
                sx={{ mb: 2, fontSize: '2.5rem', lineHeight: 1.2 }}
              >
                Welcome back to your wallet
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: 18 }}>
                Import your existing wallet using your 15-word seed phrase and regain access to
                your assets.
              </Typography>

              <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/create-account')}
                  sx={{
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': { borderWidth: 2, bgcolor: 'primary.main', color: 'white' },
                  }}
                >
                  Don&apos;t have a wallet? Create Account
                </Button>

                <Button
                  variant="text"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/sign-in')}
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  Already unlocked? Sign In →
                </Button>
              </Stack>

              <Stack spacing={2.5}>
                {[
                  {
                    icon: <ShieldIcon sx={{ fontSize: 20 }} />,
                    color: 'primary.main',
                    title: 'Secure Import',
                    desc: 'Your seed phrase never leaves your device. Complete privacy guaranteed.',
                  },
                  {
                    icon: <SwapHorizIcon sx={{ fontSize: 20 }} />,
                    color: 'secondary.main',
                    title: 'Instant Access',
                    desc: 'Restore your wallet and resume trading in seconds.',
                  },
                  {
                    icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
                    color: 'primary.main',
                    title: 'Full Features',
                    desc: 'Access all trading, swaps, and portfolio management tools instantly.',
                  },
                ].map((f) => (
                  <Stack key={f.title} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: f.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
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

          {/* Right Column - Import Form */}
          <Grid item md={7}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                minHeight: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
                background: `
                  radial-gradient(1200px 600px at 20% -10%, #FF7A59 0%, rgba(255,122,89,0) 60%),
                  radial-gradient(900px 500px at 70% 0%, #5B8CFF 0%, rgba(91,140,255,0) 60%),
                  radial-gradient(800px 400px at 40% 30%, #9D4EDD 0%, rgba(157,78,221,0) 60%),
                  linear-gradient(180deg, #0A0E1A 0%, #111827 100%)
                `,
                filter: 'saturate(1.05)',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 2.5,
                  p: 4,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ImportAccount />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export const ImportAccountPage: React.FC = () => (
  <ThemeProvider theme={landingTheme}>
    <ImportAccountInner />
  </ThemeProvider>
);
