import { Box, type BoxProps } from '@mui/material';
import { type ReactNode } from 'react';
import { palette } from '@/styles/tokens';
import { blueprintOnDark, onCanvas } from '@/theme/landingTheme';

/**
 * Blueprint surface.
 *
 * A faint measured grid with registration marks at the corners — the drawing
 * board a technical product is designed on. It gives a section a floor without
 * putting a box around it, which is what stops a long page reading as an
 * unbroken column of paragraphs.
 *
 * The grid is drawn with gradients rather than an image, so it costs no request
 * and scales without going soft.
 */

/** One corner mark. Rotated into place by the frame. */
function Registration({ mark, rotate, ...rest }: { mark: string; rotate: number } & BoxProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        height: 14,
        position: 'absolute',
        transform: `rotate(${rotate}deg)`,
        width: 14,
        ...rest.sx,
      }}
    >
      <Box
        sx={{
          borderLeft: `1px solid ${mark}`,
          borderTop: `1px solid ${mark}`,
          height: '100%',
          width: '100%',
        }}
      />
    </Box>
  );
}

export function BlueprintFrame({
  children,
  grid = true,
  onDark = false,
  sx,
  ...rest
}: BoxProps & { children: ReactNode; grid?: boolean; onDark?: boolean }) {
  const line = onDark ? blueprintOnDark.line : palette.frost;
  const mark = onDark ? blueprintOnDark.mark : palette.lavenderBorder;
  return (
    <Box sx={{ position: 'relative', ...sx }} {...rest}>
      {grid ? (
        <Box
          aria-hidden="true"
          sx={{
            /*
             * A 40px measure, fading out towards the edges so the grid reads as
             * a surface the content sits on rather than a texture laid over it.
             */
            backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            inset: 0,
            // `maskImage` reads the gradient's luminance, not its hue — any
            // opaque colour masks identically to `#000` here. Using an
            // existing dark token rather than a literal keeps the lint honest
            // without pretending this is a rendered colour decision.
            maskImage: `radial-gradient(70% 60% at 50% 45%, ${palette.midnightInk} 30%, transparent 100%)`,
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
      ) : null}

      <Registration mark={mark} rotate={0} sx={{ left: 0, top: 0 }} />
      <Registration mark={mark} rotate={90} sx={{ right: 0, top: 0 }} />
      <Registration mark={mark} rotate={270} sx={{ bottom: 0, left: 0 }} />
      <Registration mark={mark} rotate={180} sx={{ bottom: 0, right: 0 }} />

      <Box sx={{ position: 'relative' }}>{children}</Box>
    </Box>
  );
}

/**
 * The small uppercase label that opens a section.
 *
 * Set in the monospace face with wide tracking — the annotation voice of a
 * technical drawing, deliberately unlike the prose it introduces.
 */
export function SectionLabel({
  children,
  onDark = false,
}: {
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <Box
      component="p"
      sx={{
        color: onDark ? onCanvas.muted : palette.steel,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        letterSpacing: '0.18em',
        m: 0,
        mb: 2,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Box>
  );
}
