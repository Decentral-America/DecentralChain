/**
 * Icon Component System
 * Wrapper for react-icons with consistent styling
 * Compatible with Material-UI
 */

import { styled } from '@mui/material/styles';
import React from 'react';
import * as FaIcons from 'react-icons/fa'; // Font Awesome
import * as FiIcons from 'react-icons/fi'; // Feather Icons
import * as MdIcons from 'react-icons/md'; // Material Design
import { logger } from '@/lib/logger';

type MaterialIcons = keyof typeof MdIcons;
type FontAwesomeIcons = keyof typeof FaIcons;
type FeatherIcons = keyof typeof FiIcons;

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: MaterialIcons | FontAwesomeIcons | FeatherIcons;
  size?: number | string;
  color?: string;
  library?: 'md' | 'fa' | 'fi';
}

const IconWrapper = styled('span', {
  shouldForwardProp: (prop) => !['size', 'color'].includes(prop as string),
})<{ size: string; color?: string | undefined }>(({ size, color }) => ({
  '& svg': {
    height: '1em',
    width: '1em',
  },
  alignItems: 'center',
  color: color || 'currentColor',
  display: 'inline-flex',
  flexShrink: 0,
  fontSize: size,
  justifyContent: 'center',
  lineHeight: 1,
}));

const getIconLibrary = (library: 'md' | 'fa' | 'fi') => {
  switch (library) {
    case 'md':
      return MdIcons;
    case 'fa':
      return FaIcons;
    case 'fi':
      return FiIcons;
    default:
      return MdIcons;
  }
};

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ name, size = 24, color, library = 'md', ...props }, ref) => {
    const icons = getIconLibrary(library);
    const IconComponent = icons[name as keyof typeof icons] as React.ComponentType;

    if (!IconComponent) {
      logger.warn(`Icon "${name}" not found in library "${library}"`);
      return null;
    }

    const sizeValue = typeof size === 'number' ? `${size}px` : size;

    return (
      <IconWrapper ref={ref} size={sizeValue} color={color} {...props}>
        <IconComponent />
      </IconWrapper>
    );
  },
);

Icon.displayName = 'Icon';

// Common icon name exports for convenience
export const CommonIcons = {
  // Wallet
  AccountBalanceWallet: 'MdAccountBalanceWallet' as MaterialIcons,
  // Actions
  Add: 'MdAdd' as MaterialIcons,
  ArrowBack: 'MdArrowBack' as MaterialIcons,
  ArrowForward: 'MdArrowForward' as MaterialIcons,
  // Status
  Check: 'MdCheck' as MaterialIcons,
  Close: 'MdClose' as MaterialIcons,
  Delete: 'MdDelete' as MaterialIcons,
  Edit: 'MdEdit' as MaterialIcons,
  Error: 'MdError' as MaterialIcons,
  // Navigation
  Home: 'MdHome' as MaterialIcons,
  Info: 'MdInfo' as MaterialIcons,
  Menu: 'MdMenu' as MaterialIcons,
  // User
  Person: 'MdPerson' as MaterialIcons,
  Remove: 'MdRemove' as MaterialIcons,
  Save: 'MdSave' as MaterialIcons,
  Search: 'MdSearch' as MaterialIcons,
  Send: 'MdSend' as MaterialIcons,
  Settings: 'MdSettings' as MaterialIcons,
  Warning: 'MdWarning' as MaterialIcons,
};
