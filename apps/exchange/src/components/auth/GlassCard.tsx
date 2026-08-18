/**
 * The dark translucent surface every pre-app screen sits on.
 *
 * Replaces the white card that used to float on the night canvas. That card
 * was deliberate once — see the note rewritten in AuthScene — but a
 * security-critical form reading as a different product from the page around
 * it costs more than the contrast gains.
 *
 * Falls back to an opaque surface where backdrop-filter is unsupported, so
 * text contrast is never left to chance.
 */
import { Box, type SxProps, type Theme } from '@mui/material';
import { type ReactNode } from 'react';
import { brandInk } from '@/theme/landingTheme';

export function GlassCard({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{
        /*
         * The condition has to accept the prefixed form too. Emotion's stylis
         * prefixer rewrites *declarations* but passes an @supports condition
         * through verbatim, so this query was tested literally — and older iOS
         * Safari, which implements only -webkit-backdrop-filter, failed it and
         * got the opaque fallback despite being perfectly able to blur.
         */
        '@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
          backdropFilter: 'blur(20px) saturate(140%)',
          bgcolor: 'rgba(255, 255, 255, 0.04)',
        },
        // The lit top rim is what reads as glass rather than as a grey panel.
        '&::before': {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)',
          content: '""',
          height: '1px',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        // Opaque fallback first; the translucent layer only applies where
        // backdrop-filter actually works.
        bgcolor: brandInk.deep,
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(6, 3, 20, 0.55)',
        overflow: 'hidden',
        p: { md: 4, xs: 3 },
        position: 'relative',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
