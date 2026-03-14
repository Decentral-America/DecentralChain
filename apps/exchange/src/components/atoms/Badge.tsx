/**
 * Badge Component
 * Notification counts and status indicators
 * Migrated to Material-UI Chip (styled as Badge)
 */
import React from 'react';
import MuiChip, { ChipProps as MuiChipProps } from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

export interface BadgeProps extends Omit<MuiChipProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  outline?: boolean;
}

type BadgeVariant = BadgeProps['variant'];
type BadgeSize = BadgeProps['size'];

const StyledBadge = styled(MuiChip, {
  shouldForwardProp: (prop) => !['dot', 'outline', 'badgeVariant', 'badgeSize'].includes(prop as string),
})<{ dot?: boolean; outline?: boolean; badgeVariant?: BadgeVariant; badgeSize?: BadgeSize }>(
  ({ theme, badgeVariant, badgeSize, dot, outline }) => {
    const colorMap = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
    };

    const color = colorMap[badgeVariant || 'primary'];

  return {
    borderRadius: theme.shape.borderRadius * 4,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1,
    height: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 28 : 22,
    minWidth: badgeSize === 'small' ? 18 : badgeSize === 'large' ? 28 : 22,
    fontSize:
      badgeSize === 'small'
        ? theme.typography.caption.fontSize
        : badgeSize === 'large'
          ? theme.typography.body1.fontSize
          : theme.typography.body2.fontSize,
    padding: badgeSize === 'small' ? '2px 6px' : badgeSize === 'large' ? '6px 12px' : '4px 8px',
    backgroundColor: outline ? 'transparent' : color,
    color: outline ? color : 'white',
    border: outline ? `1px solid ${color}` : 'none',
    ...(dot && {
      padding: 0,
      width: 8,
      height: 8,
      minWidth: 8,
      borderRadius: '50%',
      '& .MuiChip-label': {
        display: 'none',
      },
    }),
  };
});

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ size, variant, children, ...props }, ref) => {
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
);

Badge.displayName = 'Badge';
