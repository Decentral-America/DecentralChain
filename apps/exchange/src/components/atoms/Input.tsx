/**
 * Input Component
 * Styled input with label, error states, and validation feedback
 * Replaces Angular w-input directive
 * Migrated to Material-UI TextField
 */

import InputAdornment from '@mui/material/InputAdornment';
import { styled } from '@mui/material/styles';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import React from 'react';

export interface InputProps extends Omit<TextFieldProps, 'size' | 'variant' | 'error'> {
  label?: string;
  error?: string | undefined;
  helperText?: string | undefined;
  step?: string;
  min?: string | number;
  max?: string | number;
  fullWidth?: boolean;
  inputSize?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /**
   * Whether this input is required
   */
  'aria-required'?: boolean;
  /**
   * Accessible label when visual label is not present
   */
  'aria-label'?: string;
}

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => !['inputSize', 'leftIcon', 'rightIcon'].includes(prop as string),
})<{ inputSize?: string }>(({ inputSize }) => {
  const fontSize = inputSize === 'small' ? 13 : inputSize === 'large' ? 17 : 15;

  return {
    /*
     * Medium is the theme's OutlinedInput exactly (11px 14px, 15px type, 10px
     * corners, focus halo); only the other two sizes adjust it.
     */
    '& .MuiInputBase-input': {
      ...(inputSize === 'small' ? { padding: '7px 12px' } : {}),
      ...(inputSize === 'large' ? { padding: '15px 16px' } : {}),
    },
    '& .MuiInputBase-root': {
      /*
       * iOS Safari zooms the viewport whenever a focused control computes to
       * under 16px, and does not zoom back out afterwards. `small` and
       * `medium` are under it, so they take the floor on touch devices; a
       * pointer-precise device keeps the compact size the design asks for.
       * max() rather than a flat 16px so the `large` size is raised to the
       * floor, never pulled down to it.
       */
      '@media (pointer: coarse)': { fontSize: `max(16px, ${fontSize}px)` },
      fontSize,
      letterSpacing: '-0.15px',
    },
  };
});

export function Input({
  ref,
  label,
  error,
  helperText,
  fullWidth = false,
  inputSize = 'medium',
  leftIcon,
  rightIcon,
  id,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
  required,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const generatedId = React.useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <StyledTextField
      id={inputId}
      inputRef={ref}
      label={label}
      error={!!error}
      helperText={error || helperText}
      fullWidth={fullWidth}
      inputSize={inputSize}
      size={inputSize === 'large' ? 'medium' : inputSize}
      variant="outlined"
      required={required}
      slotProps={{
        htmlInput: {
          'aria-invalid': !!error,
          'aria-label': ariaLabel,
          'aria-required': ariaRequired || required,
        },
        input: {
          endAdornment: rightIcon ? (
            <InputAdornment position="end">{rightIcon}</InputAdornment>
          ) : undefined,
          startAdornment: leftIcon ? (
            <InputAdornment position="start">{leftIcon}</InputAdornment>
          ) : undefined,
        },
      }}
      {...props}
    />
  );
}
