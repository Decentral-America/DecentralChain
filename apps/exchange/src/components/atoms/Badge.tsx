/**
 * Badge Component
 * Notification counts and status indicators
 * Migrated to Material-UI Chip (styled as Badge)
 */

import MuiChip, { type ChipProps as MuiChipProps } from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
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
    // A hardcoded 'white' ink reads fine on the vivid intent colours but is
    // unreadable on `secondary.main` (accent.muted, light in light mode:
    // ~1.2:1). Each palette entry's `contrastText` is either explicitly
    // token-verified (secondary) or MUI-computed against its own `main`, so
    // it's correct per variant rather than a single guess. See
    // task-2-report.md, Fix round 2.
    const contrastMap = {
      error: theme.palette.error.contrastText,
      info: theme.palette.info.contrastText,
      primary: theme.palette.primary.contrastText,
      secondary: theme.palette.secondary.contrastText,
      success: theme.palette.success.contrastText,
      warning: theme.palette.warning.contrastText,
    };

    const color = colorMap[badgeVariant || 'primary'];
    const contrastColor = contrastMap[badgeVariant || 'primary'];

    return {
      backgroundColor: outline ? 'transparent' : color,
      border: outline ? `1px solid ${color}` : 'none',
      borderRadius: Number(theme.shape.borderRadius) * 4,
      color: outline ? color : contrastColor,
      fontSize:
        badgeSize === 'small'
          ? theme.typography.caption.fontSize
          : badgeSize === 'large'
            ? theme.typography.body1.fontSize
            : theme.typography.body2.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      height: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 28 : 22,
      lineHeight: 1,
      minWidth: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 28 : 22,
      padding: badgeSize === 'small' ? '2px 6px' : badgeSize === 'large' ? '6px 12px' : '4px 8px',
      ...(dot && {
        '& .MuiChip-label': {
          display: 'none',
        },
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
