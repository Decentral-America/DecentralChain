import { ScheduleOutlined } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { radii } from '@/styles/tokens';
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
 */

export function ComingSoon({
  title,
  description,
  children,
}: {
  /** What is not available yet, stated plainly. */
  title: string;
  /** What will be possible, and anything the reader can do in the meantime. */
  description: string;
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
          alignItems: 'flex-start',
          /*
           * `status.warningSurface` was a fixed light literal (`#fdf6e9`).
           * The title/description below read the real ambient `text.primary`/
           * `text.secondary` ink, which this box never controlled — under the
           * old `landingTheme` wrapper that ink was always the same fixed
           * light value the panel was designed for, so the mismatch never
           * surfaced. Once a page stops forcing that wrapper, dark mode's
           * near-white ink lands on this still-fixed-light panel: measured
           * 1.01:1 (title) / 1.86:1 (description) — see task-6-report.md.
           * `surface.sunken` keeps the "recessed panel" read in both modes
           * while actually pairing with the ink that sits on it.
           */
          bgcolor: t.surface.sunken,
          borderRadius: radii.cards,
          display: 'flex',
          gap: 2,
          p: 2.5,
        }}
      >
        <ScheduleOutlined
          aria-hidden="true"
          sx={{ color: t.intent.warning, fontSize: 22, mt: 0.2 }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.primary', fontSize: 16 }}>{title}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.5, mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Box>

      {children && (
        /*
         * `inert` rather than `pointer-events: none`: the preview leaves the
         * tab order and the accessibility tree, so it cannot be operated by
         * anyone. It also takes whatever room is left inside a fitted page and
         * scrolls within it, rather than pushing the notice off the screen.
         */
        <Box inert sx={{ flex: 1, minHeight: 0, opacity: 0.55, overflowY: 'auto' }}>
          {children}
        </Box>
      )}
    </>
  );
}
