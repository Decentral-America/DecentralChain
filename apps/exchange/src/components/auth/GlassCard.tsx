/**
 * The surface every pre-app screen sits on.
 *
 * Dark mode keeps the translucent glass that replaced the white card which
 * used to float on the night canvas — that card was deliberate once, see the
 * note rewritten in AuthScene, but a security-critical form reading as a
 * different product from the page around it costs more than the contrast
 * gains. Light mode is a solid card: light "glass" reads as a grey box
 * rather than as depth, so it gets its own construction via `overlaySurface`
 * rather than an inverted version of the dark one.
 *
 * Falls back to an opaque surface where backdrop-filter is unsupported, so
 * text contrast is never left to chance.
 */
import { Box, type SxProps, type Theme, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { brandInk } from '@/theme/landingTheme';
import { overlaySurface } from '@/theme/surfaces';

/** The properties `overlaySurface('light')` actually sets. */
interface LightOverlayStyle {
  backgroundColor: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
}

/** The properties `overlaySurface('dark')` actually sets. */
interface DarkOverlayStyle extends LightOverlayStyle {
  backdropFilter: string;
  WebkitBackdropFilter: string;
}

export function GlassCard({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  const mode = useTheme().palette.mode;

  if (mode === 'light') {
    const overlay = overlaySurface(mode) as unknown as LightOverlayStyle;
    return (
      <Box
        sx={{
          ...overlay,
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

  // Dark mode only: pull the blur declarations out so they can be gated
  // behind @supports, and keep the rest (border, radius, shadow) as-is.
  const { backdropFilter, WebkitBackdropFilter, backgroundColor, ...rest } = overlaySurface(
    mode,
  ) as unknown as DarkOverlayStyle;

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
          backdropFilter,
          backgroundColor,
          WebkitBackdropFilter,
        },
        // The lit top rim is what reads as glass rather than as a grey panel.
        // Dark mode only — the same rim on a solid white card is noise.
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
        ...rest,
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
