import type React from 'react';
import styled from 'styled-components';

/**
 * Change24 Component
 *
 * Displays 24-hour price change with color coding:
 * - Positive changes: Green with up arrow
 * - Negative changes: Red with down arrow
 * - Zero/neutral: Gray
 *
 * Supports:
 * - Percentage and absolute value display
 * - Optional sign display
 * - Optional arrow icons
 * - Custom precision
 * - Size variants
 */

// Styled Components
const ChangeWrapper = styled.span<{
  variant: 'positive' | 'negative' | 'neutral';
  size?: 'small' | 'medium' | 'large';
}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: ${({ size }) => {
    switch (size) {
      case 'small':
        return '12px';
      case 'large':
        return '18px';
      default:
        return '14px';
    }
  }};
  font-weight: 500;
  color: ${({ theme, variant }) => {
    switch (variant) {
      case 'positive':
        return theme.colors.success;
      case 'negative':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  }};
`;

const Arrow = styled.span<{ direction: 'up' | 'down' }>`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  ${({ direction }) =>
    direction === 'up'
      ? 'border-bottom: 6px solid currentColor;'
      : 'border-top: 6px solid currentColor;'}
`;

const ChangeValue = styled.span`
  white-space: nowrap;
`;

// Interfaces
export interface Change24Props {
  /** The change value (can be positive, negative, or zero) */
  change: number | null | undefined;

  /** Number of decimal places (default: 2) */
  decimals?: number;

  /** Show +/- sign (default: true) */
  showSign?: boolean;

  /** Show arrow icon (default: true) */
  showArrow?: boolean;

  /** Format as percentage (default: true) */
  asPercentage?: boolean;

  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Custom className */
  className?: string;

  /** Display when value is null/undefined */
  emptyValue?: string;

  /** Threshold for considering value neutral (default: 0) */
  neutralThreshold?: number;
}

/**
 * Change24 Component
 *
 * Displays price changes with appropriate color coding
 */
export const Change24: React.FC<Change24Props> = ({
  change,
  decimals = 2,
  showSign = true,
  showArrow = true,
  asPercentage = true,
  size = 'medium',
  className,
  emptyValue = '—',
  neutralThreshold = 0,
}) => {
  // Handle null/undefined
  if (change === null || change === undefined || Number.isNaN(change)) {
    return (
      <ChangeWrapper variant="neutral" size={size} className={className}>
        <ChangeValue>{emptyValue}</ChangeValue>
      </ChangeWrapper>
    );
  }

  // Determine variant based on change value
  const variant =
    Math.abs(change) <= neutralThreshold ? 'neutral' : change > 0 ? 'positive' : 'negative';

  // Format the value
  const absoluteValue = Math.abs(change);
  const formattedValue = absoluteValue.toFixed(decimals);

  // Build the display string
  let displayValue = '';

  // Add sign if requested
  if (showSign && change !== 0) {
    displayValue += change > 0 ? '+' : '-';
  } else if (change < 0) {
    // Always show minus sign for negative values
    displayValue += '-';
  }

  // Add value
  displayValue += formattedValue;

  // Add percentage symbol if requested
  if (asPercentage) {
    displayValue += '%';
  }

  return (
    <ChangeWrapper variant={variant} size={size} className={className}>
      {showArrow && variant !== 'neutral' && (
        <Arrow direction={variant === 'positive' ? 'up' : 'down'} />
      )}
      <ChangeValue>{displayValue}</ChangeValue>
    </ChangeWrapper>
  );
};

// Convenience exports for specific sizes
export const Change24Small: React.FC<Omit<Change24Props, 'size'>> = (props) => (
  <Change24 {...props} size="small" />
);

export const Change24Large: React.FC<Omit<Change24Props, 'size'>> = (props) => (
  <Change24 {...props} size="large" />
);

// Convenience export without arrow
export const Change24NoArrow: React.FC<Omit<Change24Props, 'showArrow'>> = (props) => (
  <Change24 {...props} showArrow={false} />
);
