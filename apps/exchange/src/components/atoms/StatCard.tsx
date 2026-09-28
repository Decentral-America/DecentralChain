import { Box, Card, CardContent, Typography } from '@mui/material';
import { type ReactElement, type ReactNode } from 'react';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { hasContent } from '@/components/premium/hasContent';
import { typeScale } from '@/styles/tokens';

/**
 * A single figure with its context.
 *
 * The figure leads: it is the largest thing on the card, set semibold with
 * tabular numerals, and when it is a number its digits roll to each new value.
 * The label sits under it as quiet secondary text, the way Apple Stocks names
 * a quote. There is no icon plate and no eyebrow: a row of identical tinted
 * tiles is the dashboard-template look this system refuses.
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

/** Kept for existing call sites; the card no longer draws a tinted plate. */
export type StatTone = 'accent' | 'positive' | 'notice';

export interface StatCardProps {
  /** Accepted for compatibility; not rendered. */
  icon?: ReactElement;
  /** Accepted for compatibility; not rendered. */
  tone?: StatTone;
  /** What the figure measures. */
  label: string;
  /** The figure itself. Numbers roll; anything else renders as given. */
  value: ReactNode;
  /** Maximum fraction digits when `value` is a number. */
  decimals?: number | undefined;
  /** Unit shown after a numeric value, e.g. " DCC". */
  suffix?: string | undefined;
  /** One line explaining the figure, when it is not self-evident. */
  caption?: string | undefined;
  /** A single action, rendered as a quiet link under the figure. */
  action?: ReactNode;
  /** Rendered at the top right — a menu, a selector, a unit toggle. */
  adornment?: ReactNode;
}

/** Token sizes are px; the card sets them in rem so they follow the reader's text size. */
const rem = (px: number): string => `${px / 16}rem`;

export function StatCard({
  label,
  value,
  decimals,
  suffix,
  caption,
  action,
  adornment,
}: StatCardProps) {
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
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ alignItems: 'flex-start', display: 'flex', gap: 1.5 }}>
          <Typography
            component="p"
            sx={{
              color: 'text.primary',
              flex: 1,
              fontSize: { md: rem(typeScale.heading.size), xs: rem(typeScale.headingSm.size + 4) },
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {typeof value === 'number' ? (
              <AnimatedNumber
                value={value}
                {...(decimals !== undefined ? { decimals } : {})}
                {...(suffix ? { suffix } : {})}
              />
            ) : (
              value
            )}
          </Typography>
          {hasContent(adornment) ? <Box sx={{ flexShrink: 0 }}>{adornment}</Box> : null}
        </Box>

        {/*
         * Small text wants slightly positive tracking; the figure above wants
         * negative. A single letter-spacing for both would be wrong at one
         * end or the other.
         */}
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: rem(typeScale.bodySm.size),
            letterSpacing: '0.01em',
            mt: 0.75,
          }}
        >
          {caption ? `${label} · ${caption}` : label}
        </Typography>

        {hasContent(action) ? <Box sx={{ mt: 'auto', pt: 1.5 }}>{action}</Box> : null}
      </CardContent>
    </Card>
  );
}
