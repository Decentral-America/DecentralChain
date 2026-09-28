import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Clock } from 'lucide-react';
import { type ReactNode } from 'react';
import { hasContent } from '@/components/premium/hasContent';
import { chrome, typeScale } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The gate for a screen that is not live yet.
 *
 * The pattern it replaces was worse than saying nothing: a fully formed input
 * surface — asset pickers, amount fields, a live-looking rate panel — with a
 * small "Coming Soon" note tucked underneath it. Someone reads the form, fills
 * it in, and only then learns it does nothing. The refusal arrived after the
 * work instead of before it.
 *
 * So the notice comes first and the preview comes second, visibly held back:
 * dimmed and `inert`, which removes it from the tab order and from the
 * accessibility tree rather than merely greying it out. The screen still shows
 * what is being built — that is worth something — but it can no longer be
 * mistaken for something that works.
 *
 * The notice is a calm tinted panel in the Alert family: no border, no stripe,
 * a round glyph, a semibold line and a secondary sentence.
 */

export function ComingSoon({
  title,
  description,
  action,
  children,
}: {
  /** What is not available yet, stated plainly. */
  title: string;
  /** What will be possible, and anything the reader can do in the meantime. */
  description: string;
  /**
   * One way forward, such as a link to the screen that does work today.
   * Right-aligned beside the text; drops beneath it on narrow widths.
   */
  action?: ReactNode;
  /** The preview of the unfinished surface. Rendered inert beneath the notice. */
  children?: ReactNode;
}) {
  const { palette } = useTheme();
  const t = tokens(palette.mode);

  return (
    <>
      <Box
        role="status"
        sx={{
          alignItems: 'start',
          /*
           * The warning wash for the mode in use, not a fixed light literal:
           * the title and description read the ambient `text.primary`/
           * `text.secondary` ink, and dark mode's near-white ink on a
           * still-light panel measured 1.01:1 / 1.86:1 (task-6-report.md).
           * `chrome[mode].alert.warning.bg` is the deep amber wash in dark
           * mode, so the panel always pairs with the ink that sits on it.
           */
          bgcolor: chrome[palette.mode].alert.warning.bg,
          borderRadius: '16px',
          columnGap: 1.5,
          display: 'grid',
          gridTemplateColumns: hasContent(action)
            ? '32px minmax(0, 1fr) auto'
            : '32px minmax(0, 1fr)',
          px: 2.5,
          py: 2,
          rowGap: 1.5,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            alignItems: 'center',
            bgcolor: alpha(t.intent.warning, 0.18),
            borderRadius: '50%',
            color: t.intent.warning,
            display: 'flex',
            flexShrink: 0,
            height: 32,
            justifyContent: 'center',
            width: 32,
          }}
        >
          <Clock size={16} strokeWidth={2} />
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25 }}>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: typeScale.body.size,
              fontWeight: 600,
              letterSpacing: typeScale.body.tracking,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: typeScale.bodySm.size,
              lineHeight: 1.45,
              mt: 0.25,
            }}
          >
            {description}
          </Typography>
        </Box>
        {hasContent(action) ? (
          <Box
            sx={{
              alignSelf: 'center',
              gridColumn: { sm: 3, xs: 2 },
              gridRow: { sm: 1, xs: 2 },
              justifySelf: { sm: 'end', xs: 'start' },
            }}
          >
            {action}
          </Box>
        ) : null}
      </Box>

      {children && (
        /*
         * `inert` rather than `pointer-events: none`: the preview leaves the
         * tab order and the accessibility tree, so it cannot be operated by
         * anyone. It also takes whatever room is left inside a fitted page and
         * scrolls within it, rather than pushing the notice off the screen.
         */
        <Box inert sx={{ flex: 1, minHeight: 0, mt: 2, opacity: 0.6, overflowY: 'auto' }}>
          {children}
        </Box>
      )}
    </>
  );
}
