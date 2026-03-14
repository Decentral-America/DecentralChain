/**
 * Radio Component
 * Styled radio button with label and selection state
 * Migrated to Material-UI
 */
import React from 'react';
import MuiRadio, { RadioProps as MuiRadioProps } from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import RadioGroup from '@mui/material/RadioGroup';
import { styled } from '@mui/material/styles';

export interface RadioProps extends Omit<MuiRadioProps, 'type'> {
  label?: string;
  error?: string;
}

const RadioContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const ErrorText = styled(FormHelperText)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.body2.fontSize,
  marginLeft: theme.spacing(4),
}));

export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ label, error, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || `radio-${generatedId}`;

    const radioElement = (
      <MuiRadio
        id={radioId}
        ref={ref}
        disabled={disabled}
        inputProps={{
          'aria-invalid': !!error,
          'aria-describedby': error ? `${radioId}-error` : undefined,
        }}
        {...props}
      />
    );

    return (
      <RadioContainer>
        {label ? (
          <FormControlLabel control={radioElement} label={label} disabled={disabled} />
        ) : (
          radioElement
        )}
        {error && (
          <ErrorText id={`${radioId}-error`} role="alert">
            {error}
          </ErrorText>
        )}
      </RadioContainer>
    );
  }
);

Radio.displayName = 'Radio';

export { RadioGroup };
