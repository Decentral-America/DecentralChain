/**
 * Checkbox Component
 *
 * MUI's Checkbox for the behaviour (a real input, labels, form state) with a
 * drawn box: 6px corners, a --border-strong hairline at rest, the accent fill
 * when checked, and a check mark that draws itself in with the system spring.
 * Where a setting is an on/off preference, use MUI's Switch instead; this is
 * for consent and multi-select.
 */
import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { styled } from '@mui/material/styles';
import { motion, useReducedMotion } from 'motion/react';
import React from 'react';
import { chrome, spring } from '@/styles/tokens';

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
  fontSize: 12,
  marginLeft: theme.spacing(4),
}));

const Box = styled('span', { shouldForwardProp: (prop) => prop !== 'on' })<{ on: boolean }>(
  ({ theme, on }) => ({
    alignItems: 'center',
    backgroundColor: on ? theme.palette.primary.main : theme.palette.background.paper,
    border: `1.5px solid ${on ? theme.palette.primary.main : 'var(--border-strong)'}`,
    borderRadius: 6,
    boxSizing: 'border-box',
    color: theme.palette.primary.contrastText,
    display: 'inline-flex',
    height: 20,
    justifyContent: 'center',
    transition:
      'background-color 160ms cubic-bezier(0.32, 0.72, 0, 1), border-color 160ms cubic-bezier(0.32, 0.72, 0, 1)',
    width: 20,
  }),
);

function Mark({ variant }: { variant: 'check' | 'dash' | 'none' }) {
  const reduced = useReducedMotion();
  const on = variant !== 'none';
  return (
    <Box on={on} aria-hidden>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <motion.path
          d={variant === 'dash' ? 'M2.5 6h7' : 'M2.5 6.2 5 8.6l4.5-5.2'}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ opacity: on ? 1 : 0, pathLength: on ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : spring}
        />
      </svg>
    </Box>
  );
}

const StyledCheckbox = styled(MuiCheckbox)(({ theme }) => ({
  '& > span': {
    transition:
      'transform 160ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 160ms cubic-bezier(0.32, 0.72, 0, 1)',
  },
  '&:active > span': { transform: 'scale(0.92)' },
  '&:hover': { backgroundColor: 'transparent' },
  '&.Mui-disabled': { opacity: 0.45 },
  '&.Mui-focusVisible > span': {
    boxShadow: `0 0 0 4px ${chrome[theme.palette.mode].halo}`,
  },
}));

export function Checkbox({
  ref,
  label,
  error,
  indeterminate = false,
  disabled,
  id,
  ...props
}: CheckboxProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const generatedId = React.useId();
  const checkboxId = id || `checkbox-${generatedId}`;

  const checkboxElement = (
    <StyledCheckbox
      id={checkboxId}
      ref={ref}
      indeterminate={indeterminate}
      disabled={disabled}
      icon={<Mark variant="none" />}
      checkedIcon={<Mark variant="check" />}
      indeterminateIcon={<Mark variant="dash" />}
      slotProps={{
        input: {
          'aria-describedby': error ? `${checkboxId}-error` : undefined,
          'aria-invalid': !!error,
        },
      }}
      {...props}
    />
  );

  return (
    <CheckboxContainer>
      {label ? (
        <FormControlLabel
          control={checkboxElement}
          label={label}
          disabled={disabled}
          sx={{ '& .MuiFormControlLabel-label': { fontSize: 15, letterSpacing: '-0.15px' } }}
        />
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
}
