import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import BandTexture from '@/components/landing/BandTexture';
import { brandInk, brandSurface, ctaGradientStyles } from '@/theme/landingTheme';

/**
 * Closing conversion panel.
 *
 * The one sanctioned large indigo field in the system — a deliberate contrast
 * panel. Content stays left-aligned; the white CTA is the only bright element.
 */
export default function BigCTA() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { md: 12, xs: 8 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            ...ctaGradientStyles,
            borderRadius: brandSurface.panel,
            color: 'common.white',
            overflow: 'hidden',
            p: { md: 8, xs: 4 },
            position: 'relative',
          }}
        >
          <BandTexture width={{ md: '45%', xs: '70%' }} opacity={0.4} />
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
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.88)' },
                bgcolor: 'common.white',
                // Pinned rather than `primary.main` — this band is always the
                // fixed indigo brand field, never a light surface. See the
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
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', borderColor: 'common.white' },
                borderColor: 'rgba(255, 255, 255, 0.45)',
                color: 'common.white',
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
