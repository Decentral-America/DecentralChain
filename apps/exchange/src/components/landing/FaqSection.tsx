import { Add, Remove } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionLabel } from '@/components/landing/Blueprint';
import Reveal from '@/components/landing/Reveal';
import { brandSurface, onCanvas } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The questions someone actually has before trusting a wallet with a key.
 *
 * Answers are specific and, where the answer is "no", they say so — a landing
 * page that only lists strengths is the one nobody believes. One panel is open
 * at a time, so the section stays a readable length rather than unfolding into
 * a wall.
 */

const QUESTION_IDS = [
  'seed-storage',
  'password-recovery',
  'hardware-wallet',
  'create-token',
  'leasing',
  'trading',
] as const;

export default function FaqSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | false>(QUESTION_IDS[0]);
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';

  return (
    <Box component="section" sx={{ py: 'clamp(64px, 9vw, 128px)' }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gap: { md: 8, xs: 4 },
            gridTemplateColumns: { md: '0.8fr 1.2fr', xs: '1fr' },
          }}
        >
          <Reveal>
            <SectionLabel onDark={isDark}>{t('app.landing.faq.label')}</SectionLabel>
            <Typography
              component="h2"
              sx={{
                color: tk.text.primary,
                fontSize: 'clamp(30px, 4.4vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              {t('app.landing.faq.heading')}
            </Typography>
            <Typography sx={{ color: tk.text.secondary, fontSize: 16, lineHeight: 1.6, mt: 3 }}>
              {t('app.landing.faq.sub')}
            </Typography>
          </Reveal>

          <Reveal index={1}>
            {QUESTION_IDS.map((id) => {
              const expanded = open === id;
              return (
                <Accordion
                  key={id}
                  expanded={expanded}
                  onChange={() => setOpen(expanded ? false : id)}
                  disableGutters
                  elevation={0}
                  square={false}
                  sx={{
                    '&::before': { display: 'none' },
                    bgcolor: expanded
                      ? isDark
                        ? alpha(onCanvas.primary, 0.06)
                        : tk.surface.hover
                      : tk.surface.raised,
                    border: isDark ? brandSurface.borderOnDark : `1px solid ${tk.border.subtle}`,
                    borderRadius: `${brandSurface.radius} !important`,
                    color: tk.text.primary,
                    mb: 1.5,
                    transition: 'background-color 200ms ease',
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expanded ? (
                        <Remove sx={{ color: tk.accent.primary, fontSize: 20 }} />
                      ) : (
                        <Add sx={{ color: tk.text.tertiary, fontSize: 20 }} />
                      )
                    }
                    sx={{ px: 3, py: 1.5 }}
                  >
                    <Typography sx={{ color: tk.text.primary, fontSize: 16, pr: 2 }}>
                      {t(`app.landing.faq.questions.${id}.q`)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pb: 3, pt: 0, px: 3 }}>
                    <Typography sx={{ color: tk.text.secondary, fontSize: 15, lineHeight: 1.65 }}>
                      {t(`app.landing.faq.questions.${id}.a`)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
