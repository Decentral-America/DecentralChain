/**
 * ImportAccountPage
 * Full-screen mobile-app experience on mobile, 2-column layout on desktop.
 */

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import LoginIcon from '@mui/icons-material/Login';
import ShieldIcon from '@mui/icons-material/Shield';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useNavigate } from 'react-router';
import { MobileAuthShell } from '@/components/layout/MobileAuthShell';
import { ImportAccount } from '@/features/auth/ImportAccount';

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
        alignItems: 'center',
        bgcolor: 'background.default',
        display: 'flex',
        minHeight: '100svh',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid
          container
          spacing={6}
          sx={{
            alignItems: 'center',
          }}
        >
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
                sx={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                Welcome back to your wallet
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontSize: 18,
                  mb: 4,
                }}
              >
                Import your existing wallet using your 15-word seed phrase and regain access to your
                assets.
              </Typography>

              <Stack direction="column" spacing={2} sx={{ mb: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/create-account')}
                  sx={{
                    '&:hover': {
                      bgcolor: 'primary.main',
                      borderWidth: 2,
                      color: 'primary.contrastText',
                    },
                    borderColor: 'primary.main',
                    borderWidth: 2,
                    color: 'primary.main',
                    fontWeight: 600,
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
                    '&:hover': { bgcolor: 'action.hover' },
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  Already unlocked? Sign In →
                </Button>
              </Stack>

              <Stack spacing={2.5}>
                {[
                  {
                    color: 'primary.main',
                    desc: 'Your seed phrase never leaves your device. Complete privacy guaranteed.',
                    icon: <ShieldIcon sx={{ fontSize: 20 }} />,
                    title: 'Secure Import',
                  },
                  {
                    color: 'secondary.main',
                    desc: 'Restore your wallet and resume trading in seconds.',
                    icon: <SwapHorizIcon sx={{ fontSize: 20 }} />,
                    title: 'Instant Access',
                  },
                  {
                    color: 'primary.main',
                    desc: 'Access all trading and portfolio management tools instantly.',
                    icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
                    title: 'Full Features',
                  },
                ].map((f) => (
                  <Stack
                    key={f.title}
                    direction="row"
                    spacing={2}
                    sx={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: f.color,
                        borderRadius: '50%',
                        // Derived from `f.color`, not a second literal — the
                        // two can't drift apart. `secondary.main`
                        // (accent.muted) is light in light mode; a hardcoded
                        // 'white' measured ~1.2:1 there. See
                        // task-2-report.md, Fix round 3.
                        color: f.color.replace('.main', '.contrastText'),
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
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {f.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                        }}
                      >
                        {f.desc}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Right Column - Import Form */}
          <Grid
            size={{
              md: 7,
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                // The mesh-gradient hero was fixed-dark decoration behind the
                // glass panel below — flattened to a token rather than
                // inventing a multi-stop combination no token set specifies.
                // `background.default` (not `.paper`, which the glass panel
                // itself reads at 95% alpha below) so the panel still reads
                // as a raised surface over a backdrop, not one flat block.
                bgcolor: 'background.default',
                borderRadius: 3,
                display: 'flex',
                filter: 'saturate(1.05)',
                justifyContent: 'center',
                minHeight: '500px',
                overflow: 'hidden',
                padding: 5,
                position: 'relative',
              }}
            >
              <Box
                data-testid="import-account-panel"
                sx={{
                  backdropFilter: 'blur(10px)',
                  /*
                   * Was a fixed `rgba(255, 255, 255, 0.95)` regardless of
                   * mode. `ImportAccount`'s own `Card` sits inside this panel
                   * and already follows the real app theme (`background.paper`
                   * → `surface.raised`), so a fixed-white panel around a dark
                   * card in dark mode fractured into a white frame around a
                   * dark box — not the single cohesive glass panel this was
                   * designed as. Matched to `tokens('dark').surface.raised`
                   * (`#141029`) at the same 0.95 alpha the light panel uses,
                   * so the two surfaces stay visually one thing in both
                   * modes. See task-5-report.md, "ImportAccountPage decorative
                   * panel".
                   */
                  bgcolor: alpha(theme.palette.background.paper, 0.95),
                  borderRadius: 2.5,
                  boxShadow: 24,
                  p: 4,
                  position: 'relative',
                  width: '100%',
                  zIndex: 1,
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

export const ImportAccountPage: React.FC = () => <ImportAccountInner />;
