import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import AuroraField from '@/components/landing/AuroraField';
import BandTexture from '@/components/landing/BandTexture';
import Reveal from '@/components/landing/Reveal';
import { hasStoredAccount } from '@/lib/accountStorage';
import { brandCanvas, brandInk, heroGradientStyles, onCanvas } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * Hero section.
 *
 * A centred statement on the indigo band the app opens every screen with. The
 * headline is set large and light, and resolves from a violet tint into white
 * down its lines, so the type carries the brand rather than needing decoration
 * around it.
 *
 * The row beneath is the trust signal: the services this wallet actually reads
 * from, on glass cards over the band's brightest point.
 *
 * Dark mode keeps that fixed indigo band (`heroGradientStyles`), the aurora
 * and the contour texture, art-directed for a dark field with no honest
 * light counterpart (see AuroraField.tsx). Their ink (`onCanvas.*`) stays
 * fixed too, verified directly against the gradient's own stops in
 * HeroSection.contrast.test.tsx — a `tokens(mode)`-driven ink paired with
 * that fixed gradient would break the moment the *app* theme changed
 * independently of the gradient (task 11's "known failure mode"). Light mode
 * drops the band, the aurora and the texture entirely and paints with
 * `tokens('light')` against the page canvas beneath it, the same canvas
 * `LandingPage` itself now uses.
 */

/**
 * Where this wallet's chain and market data come from. Named rather than
 * invented — these are the services the application calls.
 */
const TRUST = [
  { key: 'decentralchain', tone: brandInk.lift },
  { key: 'dataService', tone: brandInk.violet },
  { key: 'matcher', tone: brandInk.deep },
  { key: 'ledger', tone: brandInk.night },
] as const;

export default function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Read once on mount: storage cannot change while this page is open.
  const hasAccount = useMemo(() => hasStoredAccount(), []);
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';

  return (
    <Box
      component="section"
      sx={{
        color: isDark ? onCanvas.primary : tk.text.primary,
        overflow: 'hidden',
        pb: { md: 12, xs: 9 },
        position: 'relative',
        // Clears the fixed header, which floats over this band.
        pt: { md: 20, xs: 15 },
        textAlign: 'center',
      }}
    >
      {isDark && (
        <>
          <Box sx={heroGradientStyles} />
          <AuroraField crown drifting intensity={0.85} />
          <BandTexture width={{ md: '42%', xs: '80%' }} opacity={0.35} />
        </>
      )}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Typography
            variant="overline"
            component="p"
            sx={{
              color: isDark ? onCanvas.muted : tk.text.tertiary,
              letterSpacing: '1.6px',
              mb: 3,
              mx: 'auto',
            }}
          >
            {t('app.landing.hero.eyebrow')}
          </Typography>
        </Reveal>

        <Reveal index={1}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              /*
               * Dark mode: the headline resolves from a violet tint into
               * white down its lines. Clipping a background to glyphs needs
               * a transparent fill, so `color` is the fallback for anything
               * that cannot. Light mode skips the clip entirely — a
               * violet-to-white fade reads as invisible against a near-white
               * canvas — and paints a flat `text.primary` instead.
               */
              ...(isDark
                ? {
                    backgroundClip: 'text',
                    backgroundImage:
                      'linear-gradient(180deg, rgba(196, 170, 255, 0.92) 0%, #ffffff 62%)',
                    color: onCanvas.primary,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : { color: tk.text.primary }),
              fontSize: 'clamp(40px, 7.4vw, 92px)',
              // The display voice is heavy on the marketing surface — the
              // whisper-weight scale belongs to the application ledger.
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              maxWidth: 980,
              mx: 'auto',
              textTransform: 'uppercase',
            }}
          >
            {t('app.landing.hero.headline')}
          </Typography>
        </Reveal>

        <Reveal index={2}>
          <Typography
            sx={{
              color: isDark ? onCanvas.secondary : tk.text.secondary,
              fontSize: { md: 20, xs: 16 },
              fontWeight: 300,
              lineHeight: 1.55,
              maxWidth: 620,
              mt: 4,
              mx: 'auto',
            }}
          >
            {t('app.landing.hero.subhead')}
          </Typography>
        </Reveal>

        <Reveal index={3}>
          <Stack
            direction={{ sm: 'row', xs: 'column' }}
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'center', mt: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(hasAccount ? '/sign-in' : '/create-account')}
              sx={{
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                bgcolor: 'common.white',
                /*
                 * A pill, where the application uses square ledger buttons.
                 * This is the one control on the page whose job is to invite
                 * rather than to be operated. Fixed white bg + `brandInk.deep`
                 * ink in both app themes — the same self-contained pairing as
                 * Header's/BigCTA's identical pill (see those files).
                 */
                borderRadius: 999,
                color: brandInk.deep,
                px: 4.5,
                py: 1.5,
              }}
            >
              {hasAccount ? t('app.landing.hero.ctaOpen') : t('app.landing.hero.ctaCreate')}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(hasAccount ? '/create-account' : '/sign-in')}
              sx={{
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : tk.surface.hover,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.6)' : tk.accent.primary,
                },
                borderColor: isDark ? 'rgba(255, 255, 255, 0.32)' : tk.border.strong,
                borderRadius: 999,
                color: isDark ? onCanvas.primary : tk.text.primary,
                px: 4.5,
                py: 1.5,
              }}
            >
              {hasAccount ? t('app.landing.hero.ctaAddWallet') : t('app.landing.hero.ctaHaveOne')}
            </Button>
          </Stack>
        </Reveal>

        {/* Trust row */}
        <Reveal index={4} sx={{ mt: { md: 10, xs: 8 } }}>
          <Typography
            sx={{
              color: isDark ? onCanvas.muted : tk.text.tertiary,
              fontSize: 13,
              letterSpacing: '0.4px',
              mb: 2,
              textAlign: 'left',
            }}
          >
            {t('app.landing.hero.connectedTo')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              // Column count follows the space available, not a breakpoint.
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))',
            }}
          >
            {TRUST.map((item) => (
              <Box
                key={item.key}
                sx={{
                  alignItems: 'center',
                  // Dark mode: translucent glass over the aurora field it
                  // sits on. Light mode: a real card — there is no aurora
                  // bloom to catch, so the glass effect has nothing to read
                  // against — one step up like every other card here.
                  backdropFilter: isDark ? 'blur(8px)' : 'none',
                  bgcolor: isDark ? brandCanvas.glass : tk.surface.raised,
                  border: isDark ? brandCanvas.hairline : `1px solid ${tk.border.subtle}`,
                  borderRadius: '16px',
                  display: 'flex',
                  gap: 1.5,
                  px: 2.5,
                  py: 2,
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    bgcolor: item.tone,
                    borderRadius: '50%',
                    flexShrink: 0,
                    height: 28,
                    width: 28,
                  }}
                />
                <Typography
                  sx={{
                    color: isDark ? onCanvas.primary : tk.text.primary,
                    fontSize: 15,
                    fontWeight: 400,
                  }}
                >
                  {t(`app.landing.hero.trust.${item.key}`)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
