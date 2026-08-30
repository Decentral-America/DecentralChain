import { Box, Card, CardContent, Typography } from '@mui/material';
import { type ReactElement, type ReactNode } from 'react';
import { radii, status } from '@/styles/tokens';

/**
 * A single figure with its context.
 *
 * The shape is fixed on purpose: a tinted icon plate names the thing, the
 * figure is the largest element, and anything else sits under it. Dashboards
 * drift when every card invents its own arrangement — the eye then has to
 * re-learn each one instead of scanning a row.
 *
 * There is no growth indicator here, and that is deliberate: this wallet has no
 * price oracle, so a percentage would have to be invented. A card shows what is
 * known and stays quiet about what is not.
 *
 * Sizes are in `rem` rather than `px` so the card grows with the reader's text
 * setting instead of clipping. Tracking is set per size — negative on the
 * figure, slightly positive on the label — because one value cannot be right
 * for both.
 */

/** Which tint the icon plate carries. Meaning, not decoration. */
export type StatTone = 'accent' | 'positive' | 'notice';

const TONES: Record<StatTone, { bg: string; fg: string }> = {
  accent: { bg: status.infoSurface, fg: status.info },
  notice: { bg: status.warningSurface, fg: status.warning },
  positive: { bg: status.successSurface, fg: status.success },
};

export interface StatCardProps {
  /** Small glyph shown on the tinted plate. */
  icon: ReactElement;
  tone?: StatTone;
  /** What the figure measures. */
  label: string;
  /** The figure itself. */
  value: ReactNode;
  /** One line explaining the figure, when it is not self-evident. */
  caption?: string;
  /** A single action, rendered as a quiet link under the figure. */
  action?: ReactNode;
  /** Rendered at the top right — a menu, a selector, a unit toggle. */
  adornment?: ReactNode;
}

export function StatCard({
  icon,
  tone = 'accent',
  label,
  value,
  caption,
  action,
  adornment,
}: StatCardProps) {
  const plate = TONES[tone];

  return (
    <Card
      sx={{
        '@media (prefers-reduced-motion: reduce)': {
          '&:active': { transform: 'none' },
          transition: 'none',
        },
        '&:active': { transform: 'scale(0.995)' },
        height: '100%',
        /*
         * Feedback on press, not on release. A card that only responds once
         * the click completes reads as dead under the finger.
         */
        transition: 'transform 100ms ease-out',
      }}
    >
      <CardContent
        sx={{
          '&:last-child': { pb: 1.75 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 1.75,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 1.25 }}>
          <Box
            aria-hidden="true"
            sx={{
              '& svg': { fontSize: 14 },
              alignItems: 'center',
              bgcolor: plate.bg,
              borderRadius: radii.md,
              color: plate.fg,
              display: 'flex',
              flexShrink: 0,
              height: 24,
              justifyContent: 'center',
              width: 24,
            }}
          >
            {icon}
          </Box>

          {/*
           * Small text wants slightly positive tracking; the figure below wants
           * negative. A single letter-spacing for both would be wrong at one
           * end or the other.
           */}
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.8125rem',
              letterSpacing: '0.01em',
              minWidth: 0,
            }}
          >
            {label}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
          {adornment}
        </Box>

        {/*
         * Hierarchy from weight, size and leading together — not size alone.
         * This was 32px at weight 300: large but thin, so it read as less
         * important than its size implied. Weight gives it presence without
         * asking for more room.
         */}
        <Typography
          sx={{
            color: 'text.primary',
            fontSize: '1.75rem',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            letterSpacing: '-0.022em',
            lineHeight: 1.05,
          }}
        >
          {value}
        </Typography>

        {caption && (
          <Typography
            sx={{ color: 'text.secondary', fontSize: '0.78125rem', lineHeight: 1.4, mt: 0.5 }}
          >
            {caption}
          </Typography>
        )}

        {action && <Box sx={{ mt: 'auto', pt: 1.25 }}>{action}</Box>}
      </CardContent>
    </Card>
  );
}
