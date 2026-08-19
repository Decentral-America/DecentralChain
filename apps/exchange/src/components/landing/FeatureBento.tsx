import { Box, Container, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BlueprintFrame, SectionLabel } from '@/components/landing/Blueprint';
import {
  FlowDiagram,
  GrowthDiagram,
  NodesDiagram,
  RingsDiagram,
  ShieldDiagram,
  StackDiagram,
} from '@/components/landing/diagrams';
import Reveal from '@/components/landing/Reveal';
import { brandSurface } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * What this wallet is, told as a set of drawings.
 *
 * The page previously argued in paragraphs, which on a landing page nobody
 * reads. Each claim now comes with a diagram of itself, numbered like sheets
 * of a drawing set, and the cards take different widths so the eye moves
 * through them rather than down a column of equal boxes.
 *
 * Every claim here is something the application actually does. Nothing is
 * aspirational.
 */

interface Feature {
  /** Sheet number, in the annotation voice. Also the i18n key suffix. */
  index: string;
  diagram: ReactNode;
  /** How many grid columns the card takes on a wide screen. */
  span: number;
}

const FEATURES: Feature[] = [
  { diagram: <RingsDiagram />, index: '1.0', span: 2 },
  { diagram: <StackDiagram />, index: '2.0', span: 2 },
  { diagram: <FlowDiagram />, index: '3.0', span: 1 },
  { diagram: <GrowthDiagram />, index: '4.0', span: 1 },
  { diagram: <ShieldDiagram />, index: '5.0', span: 1 },
  { diagram: <NodesDiagram />, index: '6.0', span: 1 },
];

function FeatureCard({ feature, order }: { feature: Feature; order: number }) {
  const { t } = useTranslation();
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';
  return (
    <Reveal
      index={order}
      sx={{
        // Wide cards take two columns where there is room for them.
        gridColumn: { md: `span ${feature.span}`, xs: 'span 1' },
      }}
    >
      <Box
        sx={{
          '&:hover': { borderColor: isDark ? 'rgba(255, 255, 255, 0.28)' : tk.border.strong },
          bgcolor: tk.surface.raised,
          border: isDark ? brandSurface.borderOnDark : `1px solid ${tk.border.subtle}`,
          // Feature panels bow out far past the app's card radius — the soft,
          // toy-like geometry of the marketing surface.
          borderRadius: brandSurface.panel,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: { md: 4, xs: 3 },
          transition: 'border-color 200ms ease',
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
          {feature.index}
        </Box>

        <Typography
          component="h3"
          sx={{
            color: tk.text.primary,
            fontSize: { md: 26, xs: 22 },
            fontWeight: 300,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            mt: 1.5,
          }}
        >
          {t(`app.landing.featureBento.features.${feature.index}.title`)}
        </Typography>

        {/* The drawing sits between the claim and its explanation. */}
        <Box sx={{ maxWidth: 260, mx: 'auto', my: 3, width: '100%' }}>{feature.diagram}</Box>

        <Typography sx={{ color: tk.text.secondary, fontSize: 15, lineHeight: 1.6, mt: 'auto' }}>
          {t(`app.landing.featureBento.features.${feature.index}.body`)}
        </Typography>
      </Box>
    </Reveal>
  );
}

export default function FeatureBento() {
  const { t } = useTranslation();
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';
  return (
    <Box component="section" sx={{ py: 'clamp(64px, 9vw, 128px)' }}>
      <Container maxWidth="xl">
        <BlueprintFrame onDark={isDark} sx={{ px: { md: 4, xs: 2 }, py: { md: 6, xs: 4 } }}>
          <Reveal>
            <SectionLabel onDark={isDark}>{t('app.landing.featureBento.label')}</SectionLabel>
            <Typography
              component="h2"
              sx={{
                color: tk.text.primary,
                fontSize: 'clamp(34px, 5.6vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.0,
                maxWidth: 900,
                textTransform: 'uppercase',
              }}
            >
              {t('app.landing.featureBento.headingLine1')}
              <Box component="span" sx={{ color: tk.accent.primary, display: 'block' }}>
                {t('app.landing.featureBento.headingLine2')}
              </Box>
            </Typography>
          </Reveal>

          <Box
            sx={{
              display: 'grid',
              gap: { md: 2.5, xs: 2 },
              gridTemplateColumns: {
                md: 'repeat(4, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                xs: '1fr',
              },
              mt: { md: 7, xs: 5 },
            }}
          >
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.index} feature={feature} order={index} />
            ))}
          </Box>
        </BlueprintFrame>
      </Container>
    </Box>
  );
}
