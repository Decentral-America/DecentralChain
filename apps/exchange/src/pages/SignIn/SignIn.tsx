/**
 * SignIn Page
 * Full-screen mobile-app experience on mobile, dark-canvas 2-column layout on desktop.
 */

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  alpha,
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useNavigate } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { AuthScene } from '@/components/auth/AuthScene';
import { MobileAuthScreen } from '@/components/mobile/MobileAuthScreen';
import { MobileButton } from '@/components/mobile/primitives';
import { LoginForm } from '@/features/auth/LoginForm';
import { tokens } from '@/theme/tokens/semantic';

const SignInInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // `AuthScene` picks its canvas per mode; this page's own ink has to follow
  // the same mode rather than assume the dark night canvas that used to be
  // the only option. See task-4-report.md, Fix round 1.
  const mode = theme.palette.mode;
  const t = tokens(mode);
  const isDark = mode === 'dark';

  /* ─── MOBILE: full-screen app-like shell ─── */
  if (isMobile) {
    return (
      <MobileAuthScreen
        hideBack
        title="Welcome back"
        subtitle="Unlock your wallet to continue trading."
        footer={
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <MobileButton variant="outline" onClick={() => navigate('/create-account')}>
              Create a new wallet
            </MobileButton>
            <MobileButton variant="outline" onClick={() => navigate('/import-account')}>
              Import an existing wallet
            </MobileButton>
          </Box>
        }
      >
        <LoginForm />
      </MobileAuthScreen>
    );
  }

  /* ─── DESKTOP: the night canvas the landing page arrives from ─── */
  return (
    <AuthScene>
      <Grid container spacing={{ md: 8, xs: 5 }} sx={{ alignItems: 'center' }}>
        {/* Left column — the statement */}
        <Grid size={{ md: 6, xs: 12 }}>
          <Box sx={{ mb: 4 }}>
            <Logo onDark={isDark} sx={{ height: 32 }} />
          </Box>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              maxWidth: 520,
              textTransform: 'uppercase',
            }}
          >
            Welcome back
          </Typography>

          <Typography
            sx={{
              color: t.text.secondary,
              fontSize: { md: 22, xs: 18 },
              fontWeight: 300,
              letterSpacing: '-0.22px',
              lineHeight: 1.4,
              maxWidth: 460,
              mt: 3,
            }}
          >
            Sign in to access your account and continue trading securely.
          </Typography>

          {/* Line-art icons in the accent color; no filled circles */}
          <Stack spacing={3} sx={{ mt: 6 }}>
            {[
              {
                desc: 'Your keys, your crypto. Non-custodial by design.',
                icon: <SecurityIcon sx={{ fontSize: 20 }} />,
                title: 'Bank-grade security',
              },
              {
                desc: 'Execute trades in seconds on optimized infrastructure.',
                icon: <SpeedIcon sx={{ fontSize: 20 }} />,
                title: 'Lightning fast',
              },
              {
                desc: 'Professional charts, real-time analytics, smart routing.',
                icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
                title: 'Advanced trading tools',
              },
            ].map((f) => (
              <Stack key={f.title} direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    color: t.accent.primary,
                    flexShrink: 0,
                    lineHeight: 0,
                    mt: '2px',
                  }}
                >
                  {f.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ color: t.text.primary, fontSize: 16, letterSpacing: '-0.16px' }}
                  >
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: t.text.secondary }}>
                    {f.desc}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Grid>

        {/* Right column — the form, on a flat bordered card */}
        <Grid size={{ md: 6, xs: 12 }}>
          {/* The form supplies its own card surface — no nested border here */}
          <Box sx={{ width: '100%' }}>
            <LoginForm />
          </Box>

          <Stack spacing={1} sx={{ mt: 3 }}>
            {/*
                New here? Creating a wallet is the offer, styled to hold its
                own against the form above it. Ink is explicit per mode rather
                than left to MUI's own outlined-button default: dark needs
                white to read on the night ground, and pinning light to
                `text.primary`/`text.tertiary` keeps this button's contrast
                verified against our own tokens instead of MUI's, which could
                drift independently of them.
              */}
            <Button
              variant="outlined"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={() => navigate('/create-account')}
              fullWidth
              sx={{
                '&:hover': {
                  bgcolor: isDark ? alpha(t.text.primary, 0.08) : t.surface.hover,
                  borderColor: isDark ? 'common.white' : t.text.primary,
                },
                /*
                 * The outline is the only thing identifying this control, so
                 * it owes WCAG 1.4.11's 3:1. The light branch was
                 * `border.strong` at 1.60:1 against the canvas — parked twice
                 * as unfixable on a claim that no token cleared 3:1 here.
                 * `text.tertiary` does: 5.01:1 on the canvas' top stop,
                 * 4.61:1 on its bottom one. The dark branch stays as it is —
                 * `alpha(text.primary, 0.4)` composites to 3.54:1 on the night
                 * ground, which already clears, and it is tuned to sit over
                 * the aurora field rather than on a flat fill.
                 */
                borderColor: isDark ? alpha(t.text.primary, 0.4) : t.text.tertiary,
                color: isDark ? 'common.white' : t.text.primary,
                py: 1.25,
              }}
            >
              Create a new wallet
            </Button>
            <Button
              onClick={() => navigate('/import-account')}
              fullWidth
              sx={{
                '&:hover': { color: isDark ? 'common.white' : t.text.primary },
                color: t.text.secondary,
              }}
            >
              Import existing wallet ›
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </AuthScene>
  );
};

export const SignIn: React.FC = () => <SignInInner />;
