/**
 * Button Component
 * Reusable button with variants, sizes, states, and loading functionality
 * Replaces Angular w-button directive
 * Migrated to Material-UI
 */

import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import React from 'react';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /**
   * Accessible label for screen readers
   * Required when button only contains an icon
   */
  'aria-label'?: string;
  /**
   * Describes the element controlled by this button
   */
  'aria-controls'?: string;
  /**
   * Indicates if the element controlled by this button is expanded
   */
  'aria-expanded'?: boolean;
  /**
   * Indicates if this button opens a popup/menu
   */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /**
   * Indicates if the button is pressed (for toggle buttons)
   */
  'aria-pressed'?: boolean;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => !['isLoading', 'leftIcon', 'rightIcon'].includes(prop as string),
})<{ isLoading?: boolean }>(({ theme, isLoading }) => ({
  '& .MuiButton-endIcon': {
    marginLeft: theme.spacing(1),
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  },
  pointerEvents: isLoading ? 'none' : 'auto',
  position: 'relative',
}));

const ButtonContent = styled('span')<{ isLoading?: boolean }>(({ isLoading }) => ({
  alignItems: 'center',
  display: 'inline-flex',
  opacity: isLoading ? 0 : 1,
}));

const LoadingSpinner = styled(CircularProgress)(({ theme: _theme }) => ({
  left: '50%',
  marginLeft: -10,
  marginTop: -10,
  position: 'absolute',
  top: '50%',
}));

/**
 * Map custom variants to MUI variants and colors
 */
const getButtonProps = (variant?: string) => {
  switch (variant) {
    case 'primary':
      return { color: 'primary' as const, variant: 'contained' as const };
    case 'secondary':
      return { color: 'primary' as const, variant: 'outlined' as const };
    case 'text':
      return { color: 'primary' as const, variant: 'text' as const };
    case 'danger':
      return { color: 'error' as const, variant: 'contained' as const };
    case 'success':
      return { color: 'success' as const, variant: 'contained' as const };
    default:
      return { color: 'primary' as const, variant: 'contained' as const };
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      'aria-label': ariaLabel,
      'aria-controls': ariaControls,
      'aria-expanded': ariaExpanded,
      'aria-haspopup': ariaHaspopup,
      'aria-pressed': ariaPressed,
      ...props
    },
    ref,
  ) => {
    const buttonProps = getButtonProps(variant);

    return (
      <StyledButton
        ref={ref}
        {...buttonProps}
        size={size}
        fullWidth={fullWidth}
        isLoading={isLoading}
        disabled={disabled || isLoading}
        startIcon={leftIcon}
        endIcon={rightIcon}
        aria-label={ariaLabel}
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-pressed={ariaPressed}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        <ButtonContent isLoading={isLoading}>
          {(isLoading && loadingText ? loadingText : children) as React.ReactNode}
        </ButtonContent>
        {isLoading && <LoadingSpinner size={20} color="inherit" />}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';
