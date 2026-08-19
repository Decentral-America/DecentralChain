/**
 * SignUp Page
 * Full-screen mobile-app experience on mobile, dark-canvas 2-column layout on desktop.
 *
 * The two layouts are rooted at different component types, so React unmounts
 * one tree and mounts the other whenever the viewport crosses `md` — rotating
 * a tablet is enough. `useCreateWallet` is therefore called here, above the
 * branch, and the wizard is handed its state: held inside the wizard, the seed
 * and the step index would be destroyed by that flip, handing a user who had
 * already written down their phrase a *different* wallet without saying so.
 */

import LoginIcon from '@mui/icons-material/Login';
import ShieldIcon from '@mui/icons-material/Shield';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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
import { CreateWalletWizard, useCreateWallet } from '@/features/auth/create-wallet';
import { tokens } from '@/theme/tokens/semantic';

const SignUpInner: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Above the branch on purpose — see the file header.
  const wallet = useCreateWallet();
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
        title="Create your wallet"
        subtitle="Your keys stay on this device. Nobody else can access them."
        footer={
          <MobileButton variant="outline" onClick={() => navigate('/sign-in')}>
            I already have a wallet
          </MobileButton>
        }
      >
        <CreateWalletWizard wallet={wallet} />
      </MobileAuthScreen>
    );
  }

  /* ─── DESKTOP: the same night canvas as the landing and sign-in ─── */
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
            Start trading today
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
            Create your wallet and get instant access to trading, swaps, and portfolio management.
          </Typography>

          <Stack spacing={3} sx={{ mt: 6 }}>
            {[
              {
                desc: 'You control your private keys. Your crypto, your rules.',
                icon: <ShieldIcon sx={{ fontSize: 20 }} />,
                title: 'Non-custodial security',
              },
              {
                desc: 'Smart routing finds the best rates across liquidity pools.',
                icon: <SwapHorizIcon sx={{ fontSize: 20 }} />,
                title: 'Instant token swaps',
              },
              {
                desc: 'Professional charts, portfolio tracking, and market insights.',
                icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
                title: 'Real-time analytics',
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

        {/* Right column — the wizard */}
        <Grid size={{ md: 6, xs: 12 }}>
          {/* The wizard supplies its own glass card surface — no nested border here */}
          <Box sx={{ width: '100%' }}>
            <CreateWalletWizard wallet={wallet} />
          </Box>

          <Box sx={{ mt: 3 }}>
            {/*
                Ink is explicit per mode rather than left to MUI's own
                outlined-button default: dark needs white to read on the
                night ground, and pinning light to `text.primary`/
                `border.strong` keeps this button's contrast verified against
                our own tokens instead of MUI's, which could drift
                independently of them.
              */}
            <Button
              variant="outlined"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/sign-in')}
              fullWidth
              sx={{
                '&:hover': {
                  bgcolor: isDark ? alpha(t.text.primary, 0.08) : t.surface.hover,
                  borderColor: isDark ? 'common.white' : t.text.primary,
                },
                borderColor: isDark ? alpha(t.text.primary, 0.4) : t.border.strong,
                color: isDark ? 'common.white' : t.text.primary,
                py: 1.25,
              }}
            >
              Already have an account? Sign in
            </Button>
          </Box>
        </Grid>
      </Grid>
    </AuthScene>
  );
};

export const SignUp: React.FC = () => <SignUpInner />;
