import StorageIcon from '@mui/icons-material/DnsOutlined';
import SecurityIcon from '@mui/icons-material/GppGoodOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SectionLabel } from '@/components/landing/Blueprint';
import Reveal from '@/components/landing/Reveal';
import { brandSurface } from '@/theme/landingTheme';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The specification sheet.
 *
 * Where the feature sheets argue, this enumerates: the concrete capabilities,
 * one line each, numbered in the same annotation voice. It reads like the
 * table at the back of a technical drawing set — which is the point, because
 * by now the page has made its case and this is the checklist.
 */

const SPECS = [
  { icon: <SwapHorizIcon />, index: 'A1' },
  { icon: <StorageIcon />, index: 'A2' },
  { icon: <SecurityIcon />, index: 'A3' },
  { icon: <TrendingUpIcon />, index: 'A4' },
  { icon: <ShieldIcon />, index: 'A5' },
  { icon: <QrCode2Icon />, index: 'A6' },
] as const;

export default function IconBullets() {
  const { t } = useTranslation();
  const mode = useTheme().palette.mode;
  const tk = tokens(mode);
  const isDark = mode === 'dark';
  return (
    <Box component="section" sx={{ py: 'clamp(64px, 9vw, 128px)' }}>
      <Container maxWidth="xl">
        <Reveal>
          <SectionLabel onDark={isDark}>{t('app.landing.iconBullets.label')}</SectionLabel>
          <Typography
            component="h2"
            sx={{
              color: tk.text.primary,
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              maxWidth: 640,
            }}
          >
            {t('app.landing.iconBullets.heading')}
          </Typography>
        </Reveal>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            mt: { md: 6, xs: 4 },
          }}
        >
          {SPECS.map((spec, order) => (
            <Reveal key={spec.index} index={order}>
              <Box
                sx={{
                  '&:hover': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.28)' : tk.border.strong,
                  },
                  alignItems: 'flex-start',
                  bgcolor: tk.surface.raised,
                  border: isDark ? brandSurface.borderOnDark : `1px solid ${tk.border.subtle}`,
                  borderRadius: brandSurface.radius,
                  display: 'flex',
                  gap: 2,
                  height: '100%',
                  p: 3,
                  transition: 'border-color 200ms ease',
                }}
              >
                {/* Stroked glyph on a hairline plate — drawn, not filled. */}
                <Box
                  aria-hidden="true"
                  sx={{
                    '& svg': { fontSize: 20 },
                    alignItems: 'center',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.16)' : tk.border.subtle}`,
                    borderRadius: '12px',
                    color: tk.accent.primary,
                    display: 'flex',
                    flexShrink: 0,
                    height: 44,
                    justifyContent: 'center',
                    width: 44,
                  }}
                >
                  {spec.icon}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Box
                    component="span"
                    sx={{
                      color: tk.text.tertiary,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                    }}
                  >
                    {spec.index}
                  </Box>
                  <Typography
                    sx={{ color: tk.text.primary, fontSize: 16, letterSpacing: '-0.16px' }}
                  >
                    {t(`app.landing.iconBullets.specs.${spec.index}.title`)}
                  </Typography>
                  <Typography
                    sx={{ color: tk.text.secondary, fontSize: 14, lineHeight: 1.5, mt: 0.5 }}
                  >
                    {t(`app.landing.iconBullets.specs.${spec.index}.desc`)}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
