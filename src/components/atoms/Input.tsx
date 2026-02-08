/**
 * Input Component
 * Styled input with label, error states, and validation feedback
 * Replaces Angular w-input directive
 * Migrated to Material-UI TextField
 */
import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { styled } from '@mui/material/styles';

export interface InputProps extends Omit<TextFieldProps, 'size' | 'variant' | 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
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
})<{ inputSize?: string }>(({ theme, inputSize }) => ({
  '& .MuiInputBase-root': {
    fontSize: inputSize === 'small' ? '0.875rem' : inputSize === 'large' ? '1.125rem' : '1rem',
  },
  '& .MuiInputBase-input': {
    padding:
      inputSize === 'small'
        ? theme.spacing(1, 1.5)
        : inputSize === 'large'
          ? theme.spacing(2, 3)
          : theme.spacing(1.5, 2),
  },
}));

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
    },
    ref
  ) => {
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
        InputProps={{
          startAdornment: leftIcon ? (
            <InputAdornment position="start">{leftIcon}</InputAdornment>
          ) : undefined,
          endAdornment: rightIcon ? (
            <InputAdornment position="end">{rightIcon}</InputAdornment>
          ) : undefined,
        }}
        inputProps={{
          'aria-required': ariaRequired || required,
          'aria-label': ariaLabel,
          'aria-invalid': !!error,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
