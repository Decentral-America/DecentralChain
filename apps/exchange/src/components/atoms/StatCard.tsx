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
    <Card sx={{ height: '100%' }}>
      <CardContent
        sx={{
          '&:last-child': { pb: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 2.5,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, mb: 2 }}>
          <Box
            aria-hidden="true"
            sx={{
              '& svg': { fontSize: 18 },
              alignItems: 'center',
              bgcolor: plate.bg,
              borderRadius: radii.md,
              color: plate.fg,
              display: 'flex',
              flexShrink: 0,
              height: 34,
              justifyContent: 'center',
              width: 34,
            }}
          >
            {icon}
          </Box>

          <Typography sx={{ color: 'text.secondary', fontSize: 14, minWidth: 0 }}>
            {label}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
          {adornment}
        </Box>

        <Typography
          sx={{
            color: 'text.primary',
            fontSize: 32,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>

        {caption && (
          <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1 }}>{caption}</Typography>
        )}

        {action && <Box sx={{ mt: 'auto', pt: 2 }}>{action}</Box>}
      </CardContent>
    </Card>
  );
}
