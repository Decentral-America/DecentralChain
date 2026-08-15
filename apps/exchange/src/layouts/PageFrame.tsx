import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { useSurface } from '@/components/atoms/SurfaceContext';
import { typeScale } from '@/styles/tokens';

/**
 * The frame every application screen renders inside.
 *
 * Before this existed each page invented its own header, gutter and rhythm:
 * four title sizes across four heading tags, nine different gaps between rows,
 * six card paddings. Individually none of them was wrong; together they read as
 * twelve screens stitched into one product rather than one product. The frame
 * is the fix — a page supplies a title, a subtitle and its sections, and the
 * chrome around them is no longer a per-page decision.
 *
 * Three things it guarantees:
 *
 *   - One title. `h1`, one size, once per screen, so the document outline is
 *     real and the eye lands in the same place on every route.
 *   - One rhythm. Sections are laid out by the frame's gap, so pages never
 *     carry their own `mb` values that disagree with the page beside them.
 *   - One gutter, aligned to the top bar's, so the title sits directly under
 *     the wordmark rather than a few pixels off it.
 *
 * On mobile it renders nothing of its own: `MobilePageShell` already supplies
 * the header, gutters and rhythm, and declares `compact` so the frame stands
 * down instead of drawing a second header inside the first.
 */

/** The one gap between a page's sections, in MUI spacing units (24px). */
export const pageRhythm = 3;

interface PageFrameProps {
  /** The screen's name. Rendered as the page's only `h1`. */
  title: string;
  /** One line explaining the screen. Omit when the title is self-evident. */
  subtitle?: string;
  /** Controls that belong to the screen as a whole, aligned with the title. */
  actions?: ReactNode;
  /**
   * The page is exactly the height of the shell and never scrolls as a whole;
   * whichever region inside it needs the room scrolls instead. Correct for
   * screens that are a single tool — a swap form, a portfolio, a terminal —
   * and wrong for screens that are genuinely a long document.
   */
  fit?: boolean;
  children: ReactNode;
}

export function PageFrame({ title, subtitle, actions, fit = false, children }: PageFrameProps) {
  const { compact } = useSurface();

  // The mobile shell owns the header, the gutters and the rhythm.
  if (compact) return <>{children}</>;

  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: pageRhythm,
        // Exactly the shell's content height, so nothing can push the page
        // into a scroll it does not need.
        ...(fit ? { height: '100%' } : {}),
        pb: pageRhythm,
        // The top bar already spaces itself from what follows it.
        pt: 1.5,
      }}
    >
      <Box
        sx={{
          alignItems: 'flex-end',
          display: 'flex',
          flexShrink: 0,
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              color: 'text.primary',
              fontSize: typeScale.heading.size,
              fontWeight: typeScale.heading.weight,
              letterSpacing: typeScale.heading.tracking,
              lineHeight: typeScale.heading.lineHeight,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: typeScale.body.size,
                lineHeight: 1.5,
                mt: 0.75,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actions && (
          <Box sx={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 1 }}>{actions}</Box>
        )}
      </Box>

      <Box
        sx={{
          /*
           * Legacy page chrome, neutralised at the boundary rather than trusted
           * not to come back. Pages used to set a viewport-height minimum and
           * wrap themselves in a Container that added a second gutter inside
           * the frame's own; both are the frame's job now.
           */
          '& > .MuiContainer-root': { maxWidth: 'none', px: 0 },
          '& > *': { minHeight: 'auto' },
          ...(fit
            ? {
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                /*
                 * `minHeight: 0` is what lets this shrink below its content so
                 * the region inside it scrolls. Without it the column grows and
                 * the page scrolls after all, which is the thing `fit` exists
                 * to prevent.
                 */
                minHeight: 0,
              }
            : {}),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
