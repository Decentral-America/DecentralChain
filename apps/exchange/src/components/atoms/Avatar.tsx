/**
 * Avatar Component
 * User profile images with fallback initials
 * Migrated to Material-UI Avatar
 */

import MuiAvatar, { type AvatarProps as MuiAvatarProps } from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import React from 'react';

export interface AvatarProps extends Omit<MuiAvatarProps, 'variant'> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  shape?: 'circle' | 'square';
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
};

const StyledAvatar = styled(MuiAvatar, {
  shouldForwardProp: (prop) => !['size', 'shape'].includes(prop as string),
})<{ size?: string; shape?: string }>(({ theme, size, shape }) => {
  const avatarSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
  const fontSize = fontSizeMap[size as keyof typeof fontSizeMap] || fontSizeMap.md;

  return {
    width: avatarSize,
    height: avatarSize,
    fontSize,
    borderRadius: shape === 'square' ? theme.shape.borderRadius : '50%',
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    fontWeight: theme.typography.fontWeightMedium,
  };
});
/**
 * Extract initials from name
 */
const getInitials = (name?: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.substring(0, 2).toUpperCase() ?? '';
  }
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', name, shape = 'circle', children, ...props }, ref) => {
    const initials = name ? getInitials(name) : undefined;

    return (
      <StyledAvatar ref={ref} src={src} alt={alt || name} size={size} shape={shape} {...props}>
        {!src && (children || initials)}
      </StyledAvatar>
    );
  },
);

Avatar.displayName = 'Avatar';
