/**
 * Select Component
 * Dropdown select with custom styling and options support
 * Replaces Angular w-select directive
 */
import React from 'react';
import styled, { css } from 'styled-components';

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
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.xs};
  ${(p) => p.$fullWidth && 'width: 100%;'}
`;

const Label = styled.label`
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
`;

const SelectContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/**
 * Chevron icon for select dropdown
 */
const ChevronIcon = styled.div`
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: ${(p) => p.theme.colors.disabled};
  transition: ${(p) => p.theme.transitions.fast};

  &::after {
    content: '▼';
    font-size: 10px;
  }
`;

/**
 * Size styles
 */
const sizeStyles = {
  large: css`
    padding: ${(p) => p.theme.spacing.md} ${(p) => p.theme.spacing.lg};
    font-size: ${(p) => p.theme.fontSizes.lg};
  `,
  medium: css`
    padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
    font-size: ${(p) => p.theme.fontSizes.md};
  `,
  small: css`
    padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
    font-size: ${(p) => p.theme.fontSizes.sm};
  `,
};

const StyledSelect = styled.select<{
  $hasError?: boolean;
  $selectSize?: 'small' | 'medium' | 'large';
}>`
  width: 100%;
  font-family: ${(p) => p.theme.fonts.main};
  border: 1px solid ${(p) => (p.$hasError ? p.theme.colors.error : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.md};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  transition: ${(p) => p.theme.transitions.fast};
  cursor: pointer;
  appearance: none;
  padding-right: 40px;

  /* Size styles */
  ${(p) => sizeStyles[p.$selectSize || 'medium']}

  /* Focus state */
  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(p) => p.theme.colors.primary}20;
  }

  /* Focus + chevron rotation */
  &:focus + ${ChevronIcon} {
    color: ${(p) => p.theme.colors.primary};
    transform: rotate(180deg);
  }

  /* Hover state */
  &:hover:not(:disabled):not(:focus) {
    border-color: ${(p) => (p.$hasError ? p.theme.colors.error : p.theme.colors.primary)}80;
  }

  /* Disabled state */
  &:disabled {
    background: ${(p) => p.theme.colors.hover};
    color: ${(p) => p.theme.colors.disabled};
    cursor: not-allowed;
  }

  /* Placeholder (empty value) */
  &:invalid {
    color: ${(p) => p.theme.colors.disabled};
  }

  /* Option styles */
  option {
    background: ${(p) => p.theme.colors.background};
    color: ${(p) => p.theme.colors.text};
    padding: ${(p) => p.theme.spacing.sm};

    &:disabled {
      color: ${(p) => p.theme.colors.disabled};
    }
  }
`;

const ErrorText = styled.span`
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const HelperText = styled.span`
  color: ${(p) => p.theme.colors.disabled};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      selectSize = 'medium',
      options,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;

    return (
      <SelectWrapper $fullWidth={fullWidth}>
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <SelectContainer>
          <StyledSelect
            id={selectId}
            ref={ref}
            $hasError={!!error}
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
          <ChevronIcon />
        </SelectContainer>
        {error && (
          <ErrorText id={`${selectId}-error`} role="alert">
            {error}
          </ErrorText>
        )}
        {!error && helperText && <HelperText id={`${selectId}-helper`}>{helperText}</HelperText>}
      </SelectWrapper>
    );
  },
);

Select.displayName = 'Select';
