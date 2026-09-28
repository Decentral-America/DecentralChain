/**
 * Select Component
 *
 * A native <select> (so the keyboard, the screen reader and the phone's own
 * picker all behave natively) dressed in the same field material as the MUI
 * OutlinedInput: white, a --border-strong hairline, 10px corners, an accent
 * halo on focus, and a drawn chevron instead of the platform arrow.
 */
import { ChevronDown } from 'lucide-react';
import React from 'react';
import styled, { css } from 'styled-components';
import { EASE, fieldFocus, fieldSurface } from '@/components/premium/fieldStyles';
import { noTouchZoom } from '@/styles/mixins';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string | undefined;
  fullWidth?: boolean;
  selectSize?: 'small' | 'medium' | 'large';
  options: SelectOption[];
  placeholder?: string;
}

const SelectWrapper = styled.div<{ $fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  ${(p) => p.$fullWidth && 'display: flex; width: 100%;'}
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.08px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const SelectContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Chevron = styled(ChevronDown)`
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: ${(p) => p.theme.colors.textSecondary};
  transition: color 160ms ${EASE};
`;

const sizeStyles = {
  large: css`
    min-height: 52px;
    padding: 0 40px 0 16px;
    font-size: 17px;
  `,
  medium: css`
    min-height: 44px;
    padding: 0 40px 0 14px;
    font-size: 15px;
  `,
  small: css`
    min-height: 32px;
    padding: 0 34px 0 12px;
    font-size: 13px;
  `,
};

const StyledSelect = styled.select<{
  $invalid?: boolean;
  $selectSize?: 'small' | 'medium' | 'large';
}>`
  ${fieldSurface}
  width: 100%;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  letter-spacing: -0.15px;
  line-height: 1.2;
  ${(p) => sizeStyles[p.$selectSize || 'medium']}

  /* iOS Safari zooms the page on focus below 16px; touch only. */
  ${noTouchZoom}

  &:focus-visible,
  &:focus {
    ${fieldFocus}
  }

  &:focus + ${Chevron} {
    color: ${(p) => p.theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${(p) => p.theme.colors.disabled};
    background: ${(p) => p.theme.colors.hover};
  }

  /* An empty required value shows the placeholder in the secondary colour. */
  &:invalid {
    color: ${(p) => p.theme.colors.textSecondary};
  }

  option {
    background: ${(p) => p.theme.colors.surface};
    color: ${(p) => p.theme.colors.text};
  }
`;

const ErrorText = styled.span`
  color: ${(p) => p.theme.colors.error};
  font-size: 12px;
`;

const HelperText = styled.span`
  color: ${(p) => p.theme.colors.textSecondary};
  font-size: 12px;
`;

export function Select({
  ref,
  label,
  error,
  helperText,
  fullWidth = false,
  selectSize = 'medium',
  options,
  placeholder,
  id,
  ...props
}: SelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
  const generatedId = React.useId();
  const selectId = id || `select-${generatedId}`;

  return (
    <SelectWrapper $fullWidth={fullWidth}>
      {label && <Label htmlFor={selectId}>{label}</Label>}
      <SelectContainer>
        <StyledSelect
          id={selectId}
          ref={ref}
          $invalid={!!error}
          $selectSize={selectSize}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          required={placeholder ? true : undefined}
          {...(props as Record<string, unknown>)}
        >
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </StyledSelect>
        <Chevron size={selectSize === 'small' ? 14 : 16} strokeWidth={2} aria-hidden />
      </SelectContainer>
      {error && (
        <ErrorText id={`${selectId}-error`} role="alert">
          {error}
        </ErrorText>
      )}
      {!error && helperText && <HelperText id={`${selectId}-helper`}>{helperText}</HelperText>}
    </SelectWrapper>
  );
}
