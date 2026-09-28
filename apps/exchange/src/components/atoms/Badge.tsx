/**
 * Badge Component
 * Notification counts and status indicators
 * Migrated to Material-UI Chip (styled as Badge)
 */

import MuiChip, { type ChipProps as MuiChipProps } from '@mui/material/Chip';
import { alpha, styled } from '@mui/material/styles';
import type React from 'react';

export interface BadgeProps extends Omit<MuiChipProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  outline?: boolean;
}

type BadgeVariant = BadgeProps['variant'];
type BadgeSize = BadgeProps['size'];

const StyledBadge = styled(MuiChip, {
  shouldForwardProp: (prop) =>
    !['dot', 'outline', 'badgeVariant', 'badgeSize'].includes(prop as string),
})<{ dot?: boolean; outline?: boolean; badgeVariant?: BadgeVariant; badgeSize?: BadgeSize }>(
  ({ theme, badgeVariant, badgeSize, dot, outline }) => {
    const colorMap = {
      error: theme.palette.error.main,
      info: theme.palette.info.main,
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
    };
    const color = colorMap[badgeVariant || 'primary'];
    const isDark = theme.palette.mode === 'dark';
    // `secondary.main` is a *background* role (accent.muted, ~1.2:1 against
    // itself), so the secondary badge keeps it as the fill and takes its
    // token-verified `contrastText` as ink. Every other intent is vivid
    // enough to be its own ink on a tint of itself. See task-2-report.md,
    // Fix round 2.
    const isSecondary = badgeVariant === 'secondary';
    const ink = isSecondary ? theme.palette.secondary.contrastText : color;
    const tint = isSecondary ? color : alpha(color, isDark ? 0.22 : 0.12);

    /*
     * A pill with a tint of its colour and the colour as ink: it names a state
     * without shouting over the figures around it. `outline` keeps the ink and
     * swaps the tint for a hairline.
     */
    return {
      '& .MuiChip-label': { padding: 0 },
      backgroundColor: outline ? 'transparent' : tint,
      border: outline ? `1px solid ${alpha(ink, 0.4)}` : 'none',
      borderRadius: 9999,
      color: ink,
      fontSize: badgeSize === 'large' ? 13 : 12,
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 500,
      height: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 26 : 22,
      letterSpacing: 0,
      lineHeight: 1,
      minWidth: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 26 : 22,
      padding: badgeSize === 'small' ? '0 6px' : badgeSize === 'large' ? '0 12px' : '0 8px',
      ...(dot && {
        '& .MuiChip-label': {
          display: 'none',
        },
        backgroundColor: color,
        borderRadius: '50%',
        height: 8,
        minWidth: 8,
        padding: 0,
        width: 8,
      }),
    };
  },
);

export function Badge({
  ref,
  size,
  variant,
  children,
  ...props
}: BadgeProps & { ref?: React.Ref<HTMLDivElement> }) {
  // MUI Chip only supports 'small' | 'medium', map 'large' to 'medium'
  const chipSize = size === 'large' ? 'medium' : (size as 'small' | 'medium' | undefined);
  // Pass our custom variant as a style prop, not MUI's variant
  return (
    <StyledBadge
      ref={ref}
      size={chipSize}
      variant="filled"
      label={children}
      {...(props as Omit<MuiChipProps, 'variant' | 'size'>)}
      badgeVariant={variant}
      badgeSize={size}
    />
  );
}
