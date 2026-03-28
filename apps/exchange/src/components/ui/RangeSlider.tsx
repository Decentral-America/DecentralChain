/**
 * RangeSlider Component
 * Numeric range selection with visual feedback (min/max)
 * Migrated to Material-UI
 */

import { Box, Slider as MuiSlider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const SliderContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
  cursor: disabled ? 'not-allowed' : 'default',
  opacity: disabled ? 0.5 : 1,
  padding: theme.spacing(2.5, 0),
  width: '100%',
}));

const LabelContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
}));

const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '14px',
  fontWeight: 500,
}));

const ValueDisplay = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: '14px',
  fontWeight: 600,
}));

const MinMaxContainer = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: 'flex',
  fontSize: '12px',
  justifyContent: 'space-between',
  marginTop: theme.spacing(0.5),
}));

export interface RangeSliderMark {
  value: number;
  label: string;
}

export interface RangeSliderProps {
  /**
   * Minimum value
   */
  min: number;

  /**
   * Maximum value
   */
  max: number;

  /**
   * Current value (for single slider) or [min, max] for range
   */
  value: number | [number, number];

  /**
   * Change handler
   */
  onChange: (value: number | [number, number]) => void;

  /**
   * Step increment (default: 1)
   */
  step?: number;

  /**
   * Label text
   */
  label?: string;

  /**
   * Whether to show current value
   */
  showValue?: boolean;

  /**
   * Custom value formatter
   */
  formatValue?: (value: number) => string;

  /**
   * Whether to show min/max labels
   */
  showMinMax?: boolean;

  /**
   * Custom marks to display
   */
  marks?: RangeSliderMark[] | boolean;

  /**
   * Whether the slider is disabled
   */
  disabled?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Size variant
   */
  size?: 'small' | 'medium';
}

/**
 * RangeSlider Component
 *
 * Numeric value selection with visual feedback.
 * Supports both single value and range [min, max] selection.
 *
 * @example
 * ```tsx
 * // Single value
 * const [volume, setVolume] = useState(50);
 * <RangeSlider min={0} max={100} value={volume} onChange={setVolume} />
 *
 * // Range selection
 * const [priceRange, setPriceRange] = useState([20, 80]);
 * <RangeSlider min={0} max={100} value={priceRange} onChange={setPriceRange} />
 * ```
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  showValue = false,
  formatValue,
  showMinMax = false,
  marks = false,
  disabled = false,
  className,
  ariaLabel,
  size = 'medium',
}) => {
  // Determine if range mode (value is array)
  const isRange = Array.isArray(value);

  // Format value for display
  const displayValue = React.useMemo(() => {
    if (isRange) {
      const [minVal, maxVal] = value as [number, number];
      const minFormatted = formatValue ? formatValue(minVal) : minVal;
      const maxFormatted = formatValue ? formatValue(maxVal) : maxVal;
      return `${minFormatted} - ${maxFormatted}`;
    }
    return formatValue ? formatValue(value as number) : (value as number).toString();
  }, [value, formatValue, isRange]);

  // Handle change event
  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as number | [number, number]);
  };

  // Value formatter for MUI
  const valueFormatter = formatValue || ((val: number) => val.toString());

  return (
    <SliderContainer className={className} disabled={disabled}>
      {(label || showValue) && (
        <LabelContainer>
          {label && <Label>{label}</Label>}
          {showValue && <ValueDisplay>{displayValue}</ValueDisplay>}
        </LabelContainer>
      )}

      <MuiSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        disabled={disabled}
        size={size}
        valueLabelDisplay="auto"
        valueLabelFormat={valueFormatter}
        marks={marks}
        aria-label={ariaLabel || label || 'Range slider'}
        sx={{
          '& .MuiSlider-rail': {
            height: 6,
          },
          '& .MuiSlider-thumb': {
            height: 20,
            width: 20,
          },
          '& .MuiSlider-track': {
            height: 6,
          },
        }}
      />

      {showMinMax && !marks && (
        <MinMaxContainer>
          <Typography variant="caption">{valueFormatter(min)}</Typography>
          <Typography variant="caption">{valueFormatter(max)}</Typography>
        </MinMaxContainer>
      )}
    </SliderContainer>
  );
};
