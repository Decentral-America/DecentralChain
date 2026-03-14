/**
 * Slider Component
 * Single value selection with visual feedback
 * Migrated to Material-UI
 */
import React from 'react';
import { Slider as MuiSlider, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SliderContainer = styled(Box)(() => ({
  width: '100%',
  padding: '8px 0',
}));

const Labels = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1),
  fontSize: '12px',
  color: theme.palette.text.secondary,
}));

// Interfaces
export interface SliderProps {
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Step increment (default: 1) */
  step?: number;
  /** Show value tooltip */
  showValue?: boolean;
  /** Show min/max labels */
  showLabels?: boolean;
  /** Custom value formatter */
  formatValue?: (value: number) => string;
  /** Disabled state */
  disabled?: boolean;
  /** Class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Show marks */
  marks?: boolean | { value: number; label?: string }[];
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  showValue = true,
  showLabels = false,
  formatValue,
  disabled = false,
  className,
  style,
  size = 'medium',
  marks = false,
}) => {
  // Handle change event
  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  // Format value for display
  const valueFormatter = formatValue ? formatValue : (val: number) => val.toString();

  return (
    <SliderContainer className={className} style={style}>
      <MuiSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        disabled={disabled}
        size={size}
        valueLabelDisplay={showValue ? 'auto' : 'off'}
        valueLabelFormat={valueFormatter}
        marks={marks}
        sx={{
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
          },
          '& .MuiSlider-track': {
            height: 6,
          },
          '& .MuiSlider-rail': {
            height: 6,
          },
        }}
      />

      {showLabels && (
        <Labels>
          <Typography variant="caption">{valueFormatter(min)}</Typography>
          <Typography variant="caption">{valueFormatter(max)}</Typography>
        </Labels>
      )}
    </SliderContainer>
  );
};

// Convenience exports
export const SliderWithLabels: React.FC<Omit<SliderProps, 'showLabels'>> = (props) => (
  <Slider {...props} showLabels={true} />
);

export const SliderNoValue: React.FC<Omit<SliderProps, 'showValue'>> = (props) => (
  <Slider {...props} showValue={false} />
);

export default Slider;
