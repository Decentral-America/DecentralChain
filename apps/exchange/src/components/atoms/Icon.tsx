/**
 * Icon Component System
 * Wrapper for react-icons with consistent styling
 * Compatible with Material-UI
 *
 * IMPORTANT: Only import the specific icons used in `CommonIcons`. Do NOT use
 * wildcard `* as MdIcons` — that bundles all 3,000+ icons and adds 3.3 MB to the
 * lazy chunks that include this component.
 */

import { styled } from '@mui/material/styles';
import type React from 'react';
// Named imports only — tree-shakeable (one file per icon ~200 B each)
import {
  MdAccountBalanceWallet,
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdError,
  MdHome,
  MdInfo,
  MdMenu,
  MdPerson,
  MdRemove,
  MdSave,
  MdSearch,
  MdSend,
  MdSettings,
  MdWarning,
} from 'react-icons/md';
import { logger } from '@/lib/logger';

// Static map of all icons referenced by CommonIcons. Add new entries here
// when extending CommonIcons — never use a wildcard import.
const ICON_MAP = {
  MdAccountBalanceWallet,
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdError,
  MdHome,
  MdInfo,
  MdMenu,
  MdPerson,
  MdRemove,
  MdSave,
  MdSearch,
  MdSend,
  MdSettings,
  MdWarning,
} as const;

type IconName = keyof typeof ICON_MAP;

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  size?: number | string;
  color?: string;
  /** @deprecated library selection is no longer needed — all icons are MD. */
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

export function Icon({
  ref,
  name,
  size = 24,
  color,
  library: _library,
  ...props
}: IconProps & { ref?: React.Ref<HTMLSpanElement> }) {
  const IconComponent = ICON_MAP[name] as React.ComponentType | undefined;

  if (!IconComponent) {
    logger.warn(`Icon "${name}" not found`);
    return null;
  }

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <IconWrapper ref={ref} size={sizeValue} color={color} {...props}>
      <IconComponent />
    </IconWrapper>
  );
}

// Common icon name exports for convenience
export const CommonIcons = {
  // Wallet
  AccountBalanceWallet: 'MdAccountBalanceWallet' as IconName,
  // Actions
  Add: 'MdAdd' as IconName,
  ArrowBack: 'MdArrowBack' as IconName,
  ArrowForward: 'MdArrowForward' as IconName,
  // Status
  Check: 'MdCheck' as IconName,
  Close: 'MdClose' as IconName,
  Delete: 'MdDelete' as IconName,
  Edit: 'MdEdit' as IconName,
  Error: 'MdError' as IconName,
  // Navigation
  Home: 'MdHome' as IconName,
  Info: 'MdInfo' as IconName,
  Menu: 'MdMenu' as IconName,
  // User
  Person: 'MdPerson' as IconName,
  Remove: 'MdRemove' as IconName,
  Save: 'MdSave' as IconName,
  Search: 'MdSearch' as IconName,
  Send: 'MdSend' as IconName,
  Settings: 'MdSettings' as IconName,
  Warning: 'MdWarning' as IconName,
} as const;
