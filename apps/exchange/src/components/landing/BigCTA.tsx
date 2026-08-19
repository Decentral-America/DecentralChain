import { alpha, Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import BandTexture from '@/components/landing/BandTexture';
import { brandInk, brandSurface, ctaGradientStyles, onCanvas } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * Closing conversion panel.
 *
 * The one sanctioned large indigo field in the system — a deliberate contrast
 * panel. Content stays left-aligned; the white CTA is the only bright element.
 *
 * Dark mode keeps the fixed `ctaGradientStyles` band (`brandGradient.band`)
 * this panel was art-directed for — its ink stays fixed too (`'common.white'`
 * / `brandInk.deep`), verified directly against the gradient's own stops
 * (see BigCTA.contrast.test.tsx), because a `tokens(mode)`-driven ink paired
 * with that fixed gradient would break the moment the *app* theme changed
 * independently of the gradient. Light mode drops the gradient for a solid
 * `tokens('light').accent.primary` fill — still "the one sanctioned indigo
 * field", just a flat tone rather than a band — with matching
 * `accent.onPrimary` ink, and `BandTexture` (dark-only by design) does not
 * render.
 */
export default function BigCTA() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';

  return (
    <Box component="section" sx={{ py: { md: 12, xs: 8 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            ...(isDark ? ctaGradientStyles : { background: tk.accent.primary }),
            borderRadius: brandSurface.panel,
            color: isDark ? 'common.white' : tk.accent.onPrimary,
            overflow: 'hidden',
            p: { md: 8, xs: 4 },
            position: 'relative',
          }}
        >
          {isDark && <BandTexture width={{ md: '45%', xs: '70%' }} opacity={0.4} />}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 700,
              maxWidth: 780,
              position: 'relative',
              textTransform: 'uppercase',
              zIndex: 1,
            }}
          >
            {t('app.landing.bigCta.heading')}
          </Typography>

          <Typography
            sx={{
              fontSize: { md: 20, xs: 16 },
              fontWeight: 300,
              letterSpacing: '-0.2px',
              lineHeight: 1.4,
              maxWidth: 620,
              mt: 3,
              opacity: 0.88,
            }}
          >
            {t('app.landing.bigCta.sub')}
          </Typography>

          <Stack
            direction={{ sm: 'row', xs: 'column' }}
            spacing={1}
            sx={{
              alignItems: { sm: 'center', xs: 'stretch' },
              mt: 5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/create-account')}
              sx={{
                '&:hover': { bgcolor: alpha(onCanvas.primary, 0.88) },
                bgcolor: 'common.white',
                // Pinned rather than `primary.main` — this pill's own fill is
                // a fixed white in both app themes (the panel behind it is
                // dark-ish either way: the gradient in dark mode, a solid
                // deep violet in light), so its ink stays fixed too. See the
                // identical fix and full rationale in Header.tsx and
                // task-5-report.md.
                color: brandInk.deep,
              }}
            >
              {t('app.landing.bigCta.ctaCreate')}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/sign-in')}
              sx={{
                '&:hover': {
                  bgcolor: isDark
                    ? alpha(onCanvas.primary, 0.08)
                    : alpha(tk.accent.onPrimary, 0.08),
                  borderColor: isDark ? 'common.white' : tk.accent.onPrimary,
                },
                // Both branches read on their own panel fill: `common.white`
                // is verified against the fixed gradient's stops in dark
                // mode; `tk.accent.onPrimary` is the token tied to the
                // `tk.accent.primary` fill light mode actually paints (both
                // happen to be white today, but the light branch follows the
                // fill's own token rather than a coincidence).
                borderColor: isDark
                  ? alpha(onCanvas.primary, 0.45)
                  : alpha(tk.accent.onPrimary, 0.45),
                color: isDark ? 'common.white' : tk.accent.onPrimary,
              }}
            >
              {t('app.landing.bigCta.ctaSignIn')}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
