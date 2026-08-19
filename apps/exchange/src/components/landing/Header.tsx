import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  alpha,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { brandInk } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * Landing page header.
 *
 * A white bar with a hairline bottom rule at a fixed height — no transparency,
 * no elevation change on scroll. Below the tablet breakpoint the links collapse
 * into a drawer so the bar never crowds or wraps.
 */
export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';

  /*
   * Over the hero the bar is a translucent pane the band shows through; once
   * content is passing under it, it takes a solid surface and a hairline so
   * text never runs into the navigation. A fixed opaque bar reads as a lid on
   * the page and cuts the hero off at the top.
   */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <AppBar
        elevation={0}
        sx={{
          backdropFilter: scrolled ? 'saturate(160%) blur(12px)' : 'none',
          // Darkens in dark mode, lightens in light — following whatever
          // canvas colour is actually behind the bar once it opaques on
          // scroll (LandingPage's own `tokens(mode).surface.base`).
          bgcolor: scrolled
            ? isDark
              ? 'rgba(11, 7, 36, 0.82)'
              : alpha(tk.surface.base, 0.82)
            : 'transparent',
          borderBottom: '1px solid',
          borderColor: scrolled
            ? isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : tk.border.subtle
            : 'transparent',
          // Pinned to whichever ink reads on the canvas this bar always sits
          // on — the fixed dark hero band or the pinned CTA gradient in dark
          // mode, `tokens('light').surface.base` in light. The hamburger
          // (`color="inherit"`) follows this automatically — see its own
          // comment below.
          color: isDark ? 'common.white' : tk.text.primary,
          position: 'fixed',
          top: 0,
          transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Toolbar
            sx={{
              gap: 1,
              minHeight: { md: 76, xs: 64 },
              px: 'clamp(16px, 4vw, 24px)',
            }}
          >
            {/* Same canvas the AppBar's own `color` above is tuned for. */}
            <Logo onDark={isDark} sx={{ height: { md: 32, xs: 28 } }} />

            <Box sx={{ flexGrow: 1 }} />

            {/*
              Auth actions — a filled primary always paired with its ghost
              secondary. Over the band both invert: indigo on indigo has almost
              no separation, so white carries the primary there instead.
            */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { sm: 'flex', xs: 'none' }, ml: { md: 2, xs: 0 } }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate('/sign-in')}
                sx={{
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : tk.surface.hover,
                    borderColor: isDark ? 'common.white' : tk.accent.primary,
                  },
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.45)' : tk.border.strong,
                  color: isDark ? 'common.white' : tk.text.primary,
                }}
              >
                {t('app.landing.header.signIn')}
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/create-account')}
                sx={{
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.88)' },
                  bgcolor: 'common.white',
                  /*
                   * Pinned rather than `primary.main`: this pill's own fill is
                   * a fixed white, in both app themes, so its ink must be
                   * fixed too rather than following the toggle. `primary.main`
                   * in dark mode is `accent.primary` (`#8b7dff`), tuned as
                   * text on a near-black surface, not as ink on this white
                   * pill — measured 3.24:1 there, below the 4.5:1 AA floor.
                   * `brandInk.deep` clears 17.37:1 against white regardless of
                   * mode; it's what HeroSection's own identical CTA already
                   * uses. See task-5-report.md and task-11-report.md.
                   */
                  color: brandInk.deep,
                }}
              >
                {t('app.landing.header.signUp')}
              </Button>
            </Stack>

            <IconButton
              aria-label={t('app.landing.header.openMenu')}
              /*
               * Explicit rather than the MUI default: unset, IconButton falls
               * back to `action.active`, which in light mode is
               * `rgba(0, 0, 0, 0.54)` — near-black on this bar's (then still
               * pinned) night canvas, measured 1.04:1. `inherit` picks up the
               * ink the AppBar itself declares above instead of duplicating
               * that literal here — now that the AppBar's own `color` follows
               * `mode` (task 11), this button follows automatically rather
               * than needing a second, independent fix.
               */
              color="inherit"
              edge="end"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { maxWidth: '100%', width: 280 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Logo sx={{ height: 28 }} />
        </Box>
        <Divider />
        <Stack spacing={1} sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              void navigate('/create-account');
            }}
          >
            {t('app.landing.header.signUp')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              void navigate('/sign-in');
            }}
          >
            {t('app.landing.header.signIn')}
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
