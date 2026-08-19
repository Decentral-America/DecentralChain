import { alpha, Box, Container, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BlueprintFrame, SectionLabel } from '@/components/landing/Blueprint';
import Reveal from '@/components/landing/Reveal';
import { onCanvas } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The security statement.
 *
 * One idea, set at a size nothing else on the page comes near. The claim a
 * non-custodial wallet lives or dies on deserves to be the loudest thing here,
 * and typography that large needs no illustration beside it.
 *
 * It stays on the canvas rather than a raised panel: the words are the
 * surface here, and the size jump against the cards around it is the break
 * in rhythm.
 */

const POINT_IDS = ['01', '02', '03'] as const;

export default function SecurityStatement() {
  const { t } = useTranslation();
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';
  return (
    <Box
      component="section"
      sx={{
        overflow: 'hidden',
        // Half the rhythm above: the section before it is the same canvas, and
        // a full double-gap between two blueprint sheets reads as a blank page.
        pb: 'clamp(64px, 9vw, 128px)',
        pt: 'clamp(24px, 4vw, 56px)',
      }}
    >
      <Container maxWidth="xl">
        <BlueprintFrame onDark={isDark} sx={{ px: { md: 4, xs: 2 }, py: { md: 6, xs: 4 } }}>
          <Reveal>
            <SectionLabel onDark={isDark}>{t('app.landing.securityStatement.label')}</SectionLabel>
            <Typography
              component="h2"
              sx={{
                color: tk.text.primary,
                /*
                 * Sized against the viewport rather than a breakpoint ladder, so
                 * it fills the measure at every width instead of stepping. It is
                 * deliberately the largest type on the page.
                 */
                fontSize: 'clamp(46px, 12vw, 168px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 0.92,
                textTransform: 'uppercase',
              }}
            >
              {t('app.landing.securityStatement.headingLine1')}
              <Box component="span" sx={{ color: tk.accent.primary, display: 'block' }}>
                {t('app.landing.securityStatement.headingLine2')}
              </Box>
            </Typography>
          </Reveal>

          <Box
            sx={{
              display: 'grid',
              gap: { md: 4, xs: 3 },
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
              mt: { md: 10, xs: 7 },
            }}
          >
            {POINT_IDS.map((id, index) => (
              <Reveal key={id} index={index}>
                {/* The annotation voice of the feature sheets, carried through. */}
                <Box
                  sx={{
                    borderTop: `1px solid ${isDark ? alpha(onCanvas.primary, 0.18) : tk.border.subtle}`,
                    pt: 3,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: tk.text.tertiary,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 12,
                      letterSpacing: '0.12em',
                    }}
                  >
                    {id}
                  </Box>
                  <Typography
                    sx={{
                      color: tk.text.primary,
                      fontSize: 20,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      mb: 1.5,
                      mt: 1,
                    }}
                  >
                    {t(`app.landing.securityStatement.points.${id}.title`)}
                  </Typography>
                  <Typography sx={{ color: tk.text.secondary, fontSize: 16, lineHeight: 1.6 }}>
                    {t(`app.landing.securityStatement.points.${id}.body`)}
                  </Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </BlueprintFrame>
      </Container>
    </Box>
  );
}
