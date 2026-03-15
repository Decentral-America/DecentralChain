import type React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { logger } from '@/lib/logger';

/**
 * NiceNumber Component
 *
 * A locale-aware number formatting component that uses Intl.NumberFormat
 * for proper localization. Supports:
 * - Locale-specific number formatting
 * - Currency formatting
 * - Decimal precision control
 * - Compact notation (K, M, B suffixes)
 * - Percentage formatting
 * - Sign display options
 */

// Styled Components
const NumberWrapper = styled.span<{
  color?: string | undefined;
  size?: 'small' | 'medium' | 'large';
}>`
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
  color: ${({ theme, color }) => color || theme.colors.text};
  white-space: nowrap;
`;

// Interfaces
export interface NiceNumberProps {
  /** The numeric value to format */
  value: number | string;

  /** Number of decimal places (default: 2) */
  decimals?: number;

  /** Locale for formatting (default: from i18n) */
  locale?: string;

  /** Currency code for currency formatting (e.g., 'USD', 'EUR') */
  currency?: string;

  /** Format style */
  style?: 'decimal' | 'currency' | 'percent' | 'unit';

  /** Unit for unit style (e.g., 'kilometer', 'megabyte') */
  unit?: string;

  /** Use compact notation (K, M, B) */
  compact?: boolean | 'short' | 'long';

  /** Sign display option */
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';

  /** Use grouping separator (e.g., 1,000) */
  useGrouping?: boolean;

  /** Minimum integer digits */
  minimumIntegerDigits?: number;

  /** Minimum fraction digits */
  minimumFractionDigits?: number;

  /** Maximum fraction digits */
  maximumFractionDigits?: number;

  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Custom color */
  color?: string;

  /** Custom className */
  className?: string;

  /** Notation type */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';

  /** Rounding mode */
  roundingMode?:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc';
}

interface FormatConfig {
  compact: NiceNumberProps['compact'];
  currency: string | undefined;
  decimals: number | undefined;
  maximumFractionDigits: number | undefined;
  minimumFractionDigits: number | undefined;
  minimumIntegerDigits: number | undefined;
  notation: NiceNumberProps['notation'];
  roundingMode: NiceNumberProps['roundingMode'];
  signDisplay: NonNullable<NiceNumberProps['signDisplay']>;
  style: NonNullable<NiceNumberProps['style']>;
  unit: string | undefined;
  useGrouping: boolean;
}

function buildNumberFormatOptions(config: FormatConfig): Intl.NumberFormatOptions {
  const options: Intl.NumberFormatOptions = {
    signDisplay: config.signDisplay,
    style: config.style,
    useGrouping: config.useGrouping,
  };

  if (config.currency && config.style === 'currency') options.currency = config.currency;
  if (config.unit && config.style === 'unit') options.unit = config.unit;

  if (config.compact) {
    options.notation = 'compact';
    options.compactDisplay = typeof config.compact === 'string' ? config.compact : 'short';
  } else if (config.notation) {
    options.notation = config.notation;
  }

  if (config.decimals !== undefined) {
    options.minimumFractionDigits = config.decimals;
    options.maximumFractionDigits = config.decimals;
  } else {
    if (config.minimumFractionDigits !== undefined)
      options.minimumFractionDigits = config.minimumFractionDigits;
    if (config.maximumFractionDigits !== undefined)
      options.maximumFractionDigits = config.maximumFractionDigits;
  }

  if (config.minimumIntegerDigits !== undefined)
    options.minimumIntegerDigits = config.minimumIntegerDigits;

  if (config.roundingMode) {
    (options as Intl.NumberFormatOptions & { roundingMode?: string }).roundingMode =
      config.roundingMode;
  }

  return options;
}

/**
 * NiceNumber Component
 *
 * Formats numbers with locale-aware formatting using Intl.NumberFormat
 */
export const NiceNumber: React.FC<NiceNumberProps> = ({
  value,
  decimals,
  locale,
  currency,
  style = 'decimal',
  unit,
  compact = false,
  signDisplay = 'auto',
  useGrouping = true,
  minimumIntegerDigits,
  minimumFractionDigits,
  maximumFractionDigits,
  size = 'medium',
  color,
  className,
  notation = 'standard',
  roundingMode,
}) => {
  const { i18n } = useTranslation();

  const formatted = useMemo(() => {
    try {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (Number.isNaN(numValue) || !Number.isFinite(numValue)) return '0';

      const formatLocale = locale || i18n.language || 'en-US';
      const options = buildNumberFormatOptions({
        compact,
        currency,
        decimals,
        maximumFractionDigits,
        minimumFractionDigits,
        minimumIntegerDigits,
        notation,
        roundingMode,
        signDisplay,
        style,
        unit,
        useGrouping,
      });

      return new Intl.NumberFormat(formatLocale, options).format(numValue);
    } catch (error) {
      logger.error('Error formatting number:', error);
      return String(value);
    }
  }, [
    value,
    decimals,
    locale,
    currency,
    style,
    unit,
    compact,
    signDisplay,
    useGrouping,
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
    roundingMode,
    i18n.language,
  ]);

  return (
    <NumberWrapper size={size} color={color} className={className}>
      {formatted}
    </NumberWrapper>
  );
};

// Convenience exports for common use cases
export const NiceNumberSmall: React.FC<Omit<NiceNumberProps, 'size'>> = (props) => (
  <NiceNumber {...props} size="small" />
);

export const NiceNumberLarge: React.FC<Omit<NiceNumberProps, 'size'>> = (props) => (
  <NiceNumber {...props} size="large" />
);

export const NiceCurrency: React.FC<Omit<NiceNumberProps, 'style'>> = (props) => (
  <NiceNumber {...props} style="currency" />
);

export const NicePercent: React.FC<Omit<NiceNumberProps, 'style'>> = (props) => (
  <NiceNumber {...props} style="percent" />
);

export const NiceCompact: React.FC<Omit<NiceNumberProps, 'compact'>> = (props) => (
  <NiceNumber {...props} compact={true} />
);

export default NiceNumber;
