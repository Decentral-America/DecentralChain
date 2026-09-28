/**
 * Card Component
 * Container component with elevation (shadows) and padding
 * Fundamental building block for content organization
 * Migrated to Material-UI
 */

import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type React from 'react';
import { useSurface } from './SurfaceContext';

export interface CardProps extends Omit<MuiCardProps, 'elevation'> {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: string;
  hoverable?: boolean;
  bordered?: boolean;
  as?: React.ElementType;
}

/**
 * Depth comes from the theme's MuiCard override (a soft two-layer shadow in
 * light mode, a hairline in dark, never both), so every card renders at MUI
 * elevation 0 and the prop only survives for existing call sites.
 */
const getElevation = (): number => 0;

/*
 * The single card treatment is the theme's: 16px corners and the lifted
 * surface. Nothing here re-draws a border or removes the shadow, because that
 * is how a card used to end up with both, or with neither.
 *
 * `hoverable` deepens the lift one step; `bordered` is accepted and ignored,
 * since the surface already separates itself in both modes.
 *
 * Padding is applied here only when no CardContent child supplies it; passing
 * an explicit `padding` overrides both.
 */
const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) =>
    !['hoverable', 'bordered', 'padding', 'chromeless'].includes(prop as string),
})<{ hoverable?: boolean; bordered?: boolean; padding?: string; chromeless?: boolean }>(
  ({ theme, hoverable, padding, chromeless }) => ({
    '&:has(> .MuiCardContent-root)': { padding: padding ?? 0 },
    // The same inset MuiCardContent uses, so a card without one still reads
    // the page rhythm.
    padding: padding ?? 'clamp(16px, 4vw, 24px)',
    ...(hoverable && {
      '&:active': { transform: 'scale(0.99)' },
      '&:hover':
        theme.palette.mode === 'dark'
          ? { backgroundColor: theme.palette.action.hover }
          : { boxShadow: theme.shadows[8] },
      cursor: 'pointer',
      // The :active state above is the press feedback, so the grey tap flash
      // mobile WebKit paints over the tile is redundant.
      WebkitTapHighlightColor: 'transparent',
    }),
    /*
     * Inside a region that already owns its surface, the card contributes
     * nothing but its layout: no panel, no shadow, no inset. The content
     * padding is zeroed here because CardContent is MUI's own component and
     * has no knowledge of this context.
     */
    ...(chromeless && {
      '& > .MuiCardContent-root': { padding: 0 },
      '& > .MuiCardContent-root:last-child': { paddingBottom: 0 },
      backgroundColor: 'transparent',
      border: 0,
      boxShadow: 'none',
      padding: 0,
    }),
  }),
);

/**
 * Card compound components for structured layouts
 */
export { CardActions as CardFooter, CardContent as CardBody, CardHeader };

export const CardTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '-0.3px',
  margin: 0,
}));

export const CardDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 13,
  lineHeight: 1.45,
  margin: `${theme.spacing(0.5)} 0 0 0`,
}));

export function Card({
  ref,
  elevation: _elevation,
  ...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { chromeless } = useSurface();
  return (
    <StyledCard
      ref={ref}
      elevation={getElevation()}
      chromeless={chromeless}
      {...(props as Record<string, unknown>)}
    />
  );
}
