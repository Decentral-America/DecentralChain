/**
 * Checkbox Component
 * Styled checkbox with label and checked state
 * Replaces Angular w-checkbox directive
 * Migrated to Material-UI
 */

import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { styled } from '@mui/material/styles';
import React from 'react';

export interface CheckboxProps extends Omit<MuiCheckboxProps, 'type'> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

const CheckboxContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const ErrorText = styled(FormHelperText)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.body2.fontSize,
  marginLeft: theme.spacing(4),
}));

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, error, indeterminate = false, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    const checkboxElement = (
      <MuiCheckbox
        id={checkboxId}
        ref={ref}
        indeterminate={indeterminate}
        disabled={disabled}
        inputProps={{
          'aria-describedby': error ? `${checkboxId}-error` : undefined,
          'aria-invalid': !!error,
        }}
        {...props}
      />
    );

    return (
      <CheckboxContainer>
        {label ? (
          <FormControlLabel control={checkboxElement} label={label} disabled={disabled} />
        ) : (
          checkboxElement
        )}
        {error && (
          <ErrorText id={`${checkboxId}-error`} role="alert">
            {error}
          </ErrorText>
        )}
      </CheckboxContainer>
    );
  },
);

Checkbox.displayName = 'Checkbox';
