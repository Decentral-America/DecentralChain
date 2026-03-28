import { BigNumber } from '@decentralchain/bignumber';
import type React from 'react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { logger } from '@/lib/logger';

/**
 * Balance Component
 *
 * A specialized display component for cryptocurrency balances with:
 * - BigNumber.js support for precise decimal handling
 * - Short mode for large numbers (1.5M, 345.2K)
 * - Decimal precision control
 * - Formatted number display with separators
 * - Split styling for integer and decimal parts
 */

// Styled Components
const BalanceWrapper = styled.span<{ size?: 'small' | 'medium' | 'large' }>`
  font-family: 'Roboto Mono', monospace;
  font-size: ${({ size }) => {
    switch (size) {
      case 'small':
        return '12px';
      case 'large':
        return '20px';
      default:
        return '16px';
    }
  }};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
`;

const IntegerPart = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const DecimalPart = styled.span`
  font-weight: 400;
  color: ${({ theme }) => `${theme.colors.text}80`};
  font-size: 0.9em;
`;

const SymbolText = styled.span`
  margin-left: 4px;
  font-weight: 500;
  color: ${({ theme }) => `${theme.colors.text}80`};
`;

const ShortNumber = styled.span`
  font-weight: 600;
`;

// Interfaces
export interface BalanceProps {
  /** Amount to display (string, number, or BigNumber) */
  amount: string | number | BigNumber;

  /** Number of decimal places (default: 8) */
  decimals?: number;

  /** Asset symbol to display (e.g., "DCC", "DCC") */
  symbol?: string;

  /** Show full precision without rounding */
  showFullPrecision?: boolean;

  /** Enable short mode for large numbers (e.g., 1.5M, 345K) */
  shortMode?: boolean | number;

  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Minimum value for short mode (default: 10000) */
  shortModeThreshold?: number;

  /** Show thousands separator */
  showSeparator?: boolean;

  /** Custom className */
  className?: string;
}

// Utility functions
const parseNumber = (value: string | number | BigNumber): BigNumber => {
  if (value instanceof BigNumber) {
    return value;
  }
  return new BigNumber(value || 0);
};

const formatWithSeparator = (value: string, separator: string = ','): string => {
  const parts = value.split('.');
  const integerPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, separator) ?? '';
  return parts[1] ? `${integerPart}.${parts[1]}` : integerPart;
};

const getShortFormat = (bn: BigNumber): { value: string; suffix: string } => {
  if (bn.gte(1000000000)) {
    // Billions
    return {
      suffix: 'B',
      value: bn.div(1000000000).toFixed(1),
    };
  } else if (bn.gte(1000000)) {
    // Millions
    return {
      suffix: 'M',
      value: bn.div(1000000).toFixed(1),
    };
  } else if (bn.gte(1000)) {
    // Thousands
    return {
      suffix: 'K',
      value: bn.div(1000).toFixed(1),
    };
  }

  return {
    suffix: '',
    value: bn.toFixed(0),
  };
};

const trimTrailingZeros = (decimal: string): string => {
  return decimal.replace(/0+$/, '');
};

/**
 * Balance Component
 *
 * Displays cryptocurrency balances with proper formatting
 */
export const Balance: React.FC<BalanceProps> = ({
  amount,
  decimals = 8,
  symbol,
  showFullPrecision = false,
  shortMode = false,
  size = 'medium',
  shortModeThreshold = 10000,
  showSeparator = true,
  className,
}) => {
  const formatted = useMemo(() => {
    try {
      const bn = parseNumber(amount);

      // Handle zero or very small numbers
      if (bn.isZero()) {
        return {
          decimal: '',
          integer: '0',
          type: 'normal' as const,
        };
      }

      // Check if we should use short mode
      const isShortMode = typeof shortMode === 'number' ? true : shortMode;
      const minValue = typeof shortMode === 'number' ? shortMode : shortModeThreshold;

      if (isShortMode && bn.abs().gte(minValue)) {
        const { value, suffix } = getShortFormat(bn.abs());
        const sign = bn.isNegative() ? '-' : '';
        return {
          suffix,
          type: 'short' as const,
          value: `${sign}${value}`,
        };
      }

      // Normal formatting
      const fixed = showFullPrecision
        ? bn.toFixed(decimals, 1) // ROUND_DOWN = 1
        : bn.toFixed(decimals);

      const [integer, decimal] = fixed.split('.');

      // Format with separator if enabled
      const formattedInteger = showSeparator ? formatWithSeparator(integer ?? '') : (integer ?? '');

      // Trim trailing zeros from decimal part
      const trimmedDecimal = decimal ? trimTrailingZeros(decimal) : '';

      return {
        decimal: trimmedDecimal ? `.${trimmedDecimal}` : '',
        integer: formattedInteger,
        type: 'normal' as const,
      };
    } catch (error) {
      logger.error('Error formatting balance:', error);
      return {
        decimal: '',
        integer: '0',
        type: 'normal' as const,
      };
    }
  }, [amount, decimals, showFullPrecision, shortMode, shortModeThreshold, showSeparator]);

  if (formatted.type === 'short') {
    return (
      <BalanceWrapper size={size} className={className}>
        <ShortNumber>
          {formatted.value}
          {formatted.suffix}
        </ShortNumber>
        {symbol && <SymbolText>{symbol}</SymbolText>}
      </BalanceWrapper>
    );
  }

  return (
    <BalanceWrapper size={size} className={className}>
      <IntegerPart>{formatted.integer}</IntegerPart>
      {formatted.decimal && <DecimalPart>{formatted.decimal}</DecimalPart>}
      {symbol && <SymbolText>{symbol}</SymbolText>}
    </BalanceWrapper>
  );
};

// Convenience exports for common use cases
export const BalanceSmall: React.FC<Omit<BalanceProps, 'size'>> = (props) => (
  <Balance {...props} size="small" />
);

export const BalanceLarge: React.FC<Omit<BalanceProps, 'size'>> = (props) => (
  <Balance {...props} size="large" />
);

export const BalanceShort: React.FC<Omit<BalanceProps, 'shortMode'>> = (props) => (
  <Balance {...props} shortMode={true} />
);
