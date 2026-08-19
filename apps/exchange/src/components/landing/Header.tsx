import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { brandInk } from '@/theme/landingTheme';

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
          // The page is dark throughout now, so the pinned bar darkens rather
          // than turning to paper.
          bgcolor: scrolled ? 'rgba(11, 7, 36, 0.82)' : 'transparent',
          borderBottom: '1px solid',
          borderColor: scrolled ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          color: 'common.white',
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
            {/* The header sits on the night canvas in both states. */}
            <Logo onDark sx={{ height: { md: 32, xs: 28 } }} />

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
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'common.white',
                  },
                  borderColor: 'rgba(255, 255, 255, 0.45)',
                  color: 'common.white',
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
                   * Pinned rather than `primary.main`: this bar always sits on
                   * the fixed night canvas (transparent over Hero, or its own
                   * dark fill once scrolled — never a light surface), so its
                   * ink must not follow the app's light/dark toggle either.
                   * `primary.main` in dark mode is `accent.primary`
                   * (`#8b7dff`), tuned as text on a near-black surface, not as
                   * ink on this white pill — measured 3.24:1 there, below the
                   * 4.5:1 AA floor. `brandInk.deep` is what HeroSection's own
                   * identical CTA already uses. See task-5-report.md.
                   */
                  color: brandInk.deep,
                }}
              >
                {t('app.landing.header.signUp')}
              </Button>
            </Stack>

            <IconButton
              aria-label={t('app.landing.header.openMenu')}
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
