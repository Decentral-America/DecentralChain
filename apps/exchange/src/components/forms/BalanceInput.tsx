import { BigNumber } from 'bignumber.js';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { logger } from '@/lib/logger';

/**
 * BalanceInput Component
 *
 * A specialized input component for cryptocurrency balance entry with:
 * - BigNumber.js support for precise decimal handling
 * - MAX button to fill maximum available balance
 * - Fee deduction calculation
 * - Decimal precision validation
 * - Formatted placeholder based on decimals
 */

// Styled Components
const BalanceInputWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  gap: 8px;
  width: 100%;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
`;

const InputContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  display: block;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-family: 'Roboto Mono', monospace;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid
    ${({ theme, hasError }) => (hasError ? theme.colors.error : theme.colors.border)};
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.colors.error : theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => `${theme.colors.text}40`};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const MaxButton = styled.button<{ variant?: 'primary' | 'secondary'; size?: 'sm' | 'md' }>`
  padding: ${({ size }) => (size === 'sm' ? '8px 16px' : '12px 24px')};
  font-size: ${({ size }) => (size === 'sm' ? '14px' : '16px')};
  font-weight: 600;
  color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.background : theme.colors.primary};
  background-color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : 'transparent'};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-end;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px ${({ theme }) => `${theme.colors.primary}40`};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const HelperText = styled.div<{ error?: boolean }>`
  font-size: 12px;
  color: ${({ theme, error }) => (error ? theme.colors.error : `${theme.colors.text}80`)};
  margin-top: 4px;
`;

const BalanceInfo = styled.div`
  font-size: 12px;
  color: ${({ theme }) => `${theme.colors.text}80`};
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// Interfaces
export interface BalanceInputProps {
  /** Current value as string (to preserve precision) */
  value: string;

  /** Callback when value changes */
  onChange: (value: string) => void;

  /** Maximum available balance (optional) */
  maxBalance?: string;

  /** Fee to deduct from max balance (optional) */
  fee?: string;

  /** Number of decimal places (default: 8) */
  decimals?: number;

  /** Label for the input */
  label?: string;

  /** Helper text below input */
  helperText?: string;

  /** Error message */
  error?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Asset symbol for display (e.g., "DCC", "DCC") */
  assetSymbol?: string;

  /** Minimum value validation */
  min?: string;

  /** Placeholder override */
  placeholder?: string;

  /** Show balance info */
  showBalanceInfo?: boolean;

  /** Custom onFocus handler */
  onFocus?: () => void;

  /** Custom onBlur handler */
  onBlur?: () => void;
}

/**
 * BalanceInput Component
 *
 * Handles cryptocurrency amounts with BigNumber precision
 */
export const BalanceInput: React.FC<BalanceInputProps> = ({
  value,
  onChange,
  maxBalance,
  fee,
  decimals = 8,
  label,
  helperText,
  error,
  disabled = false,
  assetSymbol,
  min,
  placeholder,
  showBalanceInfo = true,
  onFocus,
  onBlur,
}) => {
  const [internalError, setInternalError] = useState<string | undefined>(error);

  // Update internal error when prop changes
  useEffect(() => {
    setInternalError(error);
  }, [error]);

  // Calculate real max balance (maxBalance - fee)
  const realMaxBalance = useCallback(() => {
    if (!maxBalance) return null;

    try {
      const maxBN = new BigNumber(maxBalance);

      if (!fee) return maxBN.toFixed(decimals);

      const feeBN = new BigNumber(fee);
      const result = maxBN.minus(feeBN);

      // If result is negative, return '0'
      if (result.isLessThan(0)) {
        return new BigNumber(0).toFixed(decimals);
      }

      return result.toFixed(decimals);
    } catch (err) {
      logger.error('Error calculating max balance:', err);
      return null;
    }
  }, [maxBalance, fee, decimals]);

  // Validate input value
  const validateInput = useCallback(
    (input: string): boolean => {
      if (!input || input === '') return true;

      try {
        const bn = new BigNumber(input);

        // Check if it's a valid number
        if (!bn.isFinite()) {
          setInternalError('Invalid number');
          return false;
        }

        // Check minimum value
        if (min) {
          const minBN = new BigNumber(min);
          if (bn.isLessThan(minBN)) {
            setInternalError(`Minimum value is ${min}`);
            return false;
          }
        }

        // Check maximum value
        const realMax = realMaxBalance();
        if (realMax) {
          const maxBN = new BigNumber(realMax);
          if (bn.isGreaterThan(maxBN)) {
            setInternalError('Insufficient balance');
            return false;
          }
        }

        setInternalError(undefined);
        return true;
      } catch {
        setInternalError('Invalid number format');
        return false;
      }
    },
    [min, realMaxBalance],
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty input
      if (input === '') {
        onChange('');
        setInternalError(undefined);
        return;
      }

      // Allow only numbers, single decimal point, and leading zeros
      if (!/^\d*\.?\d*$/.test(input)) {
        return;
      }

      // Check decimal places
      const parts = input.split('.');
      if (parts[1] && parts[1].length > decimals) {
        return;
      }

      // Update value
      onChange(input);

      // Validate after a short delay (to avoid showing errors while typing)
      setTimeout(() => validateInput(input), 300);
    },
    [onChange, decimals, validateInput],
  );

  // Handle MAX button click
  const handleMax = useCallback(() => {
    const max = realMaxBalance();
    if (max) {
      onChange(max);
      setInternalError(undefined);
    }
  }, [realMaxBalance, onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    validateInput(value);
    onBlur?.();
  }, [value, validateInput, onBlur]);

  // Generate placeholder based on decimals
  const defaultPlaceholder = `0.${'0'.repeat(decimals)}`;

  // Format balance for display
  const formatBalance = (balance: string | null): string => {
    if (!balance) return '0';
    try {
      const bn = new BigNumber(balance);
      return bn.toFixed(decimals);
    } catch {
      return balance;
    }
  };

  return (
    <BalanceInputWrapper disabled={disabled}>
      <InputContainer>
        {label && <Label>{label}</Label>}

        <InputWrapper>
          <StyledInput
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || defaultPlaceholder}
            disabled={disabled}
            hasError={!!internalError}
            aria-label={label || 'Balance input'}
            aria-invalid={!!internalError}
            aria-describedby={
              internalError
                ? 'balance-input-error'
                : helperText
                  ? 'balance-input-helper'
                  : undefined
            }
          />
        </InputWrapper>

        {internalError && (
          <HelperText error id="balance-input-error">
            {internalError}
          </HelperText>
        )}

        {!internalError && helperText && (
          <HelperText id="balance-input-helper">{helperText}</HelperText>
        )}

        {showBalanceInfo && maxBalance && (
          <BalanceInfo>
            <span>
              Available: {formatBalance(realMaxBalance())} {assetSymbol || ''}
            </span>
            {fee && (
              <span>
                Fee: {formatBalance(fee)} {assetSymbol || ''}
              </span>
            )}
          </BalanceInfo>
        )}
      </InputContainer>

      {maxBalance && (
        <MaxButton
          onClick={handleMax}
          disabled={disabled}
          variant="secondary"
          size="sm"
          aria-label="Fill maximum balance"
        >
          MAX
        </MaxButton>
      )}
    </BalanceInputWrapper>
  );
};
