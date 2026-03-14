import React from 'react';
import styled from 'styled-components';

/**
 * Styled SVG element rotated -90 degrees to start from top
 */
const Svg = styled.svg`
  transform: rotate(-90deg);
  transition: transform 0.2s ease;

  &:hover {
    transform: rotate(-90deg) scale(1.02);
  }
`;

/**
 * Animated circle element for smooth transitions
 */
const Circle = styled.circle<{ $animated?: boolean }>`
  transition: ${(props) => (props.$animated ? 'stroke-dashoffset 0.5s ease' : 'none')};
`;

/**
 * Container for the chart with center content
 */
const Container = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Center content overlay
 */
const CenterContent = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

/**
 * Props for CircleChart component
 */
export interface CircleChartProps {
  /**
   * Progress value (0-100)
   */
  value: number;

  /**
   * Size of the chart in pixels
   * @default 100
   */
  size?: number;

  /**
   * Width of the stroke in pixels
   * @default 8
   */
  strokeWidth?: number;

  /**
   * Color of the background circle
   * @default '#e0e0e0'
   */
  backgroundColor?: string;

  /**
   * Color of the progress circle
   * @default '#1f77b4'
   */
  progressColor?: string;

  /**
   * Whether to animate transitions
   * @default true
   */
  animated?: boolean;

  /**
   * Content to display in the center of the chart
   */
  children?: React.ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Line cap style
   * @default 'round'
   */
  lineCap?: 'butt' | 'round' | 'square';

  /**
   * Show percentage text in center
   * @default false
   */
  showPercentage?: boolean;

  /**
   * Custom percentage formatter
   */
  formatPercentage?: (value: number) => string;
}

/**
 * Circular progress chart component
 *
 * Displays a circular progress indicator using SVG. Supports
 * customization of size, colors, stroke width, and center content.
 *
 * @example
 * ```tsx
 * <CircleChart value={75} size={120} strokeWidth={10} />
 * ```
 *
 * @example With custom colors
 * ```tsx
 * <CircleChart
 *   value={60}
 *   progressColor="#4caf50"
 *   backgroundColor="#f5f5f5"
 * />
 * ```
 *
 * @example With center content
 * ```tsx
 * <CircleChart value={85} showPercentage>
 *   <div>Loading...</div>
 * </CircleChart>
 * ```
 */
export const CircleChart: React.FC<CircleChartProps> = ({
  value,
  size = 100,
  strokeWidth = 8,
  backgroundColor = '#e0e0e0',
  progressColor = '#1f77b4',
  animated = true,
  children,
  className,
  lineCap = 'round',
  showPercentage = false,
  formatPercentage = (val) => `${Math.round(val)}%`,
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;
  const center = size / 2;

  return (
    <Container className={className} style={{ width: size, height: size }}>
      <Svg width={size} height={size} role="img" aria-label={`Progress: ${clampedValue}%`}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap={lineCap}
          $animated={animated}
        />
      </Svg>

      {/* Center content */}
      {(children || showPercentage) && (
        <CenterContent>
          {showPercentage && !children && (
            <span style={{ fontWeight: 'bold' }}>{formatPercentage(clampedValue)}</span>
          )}
          {children}
        </CenterContent>
      )}
    </Container>
  );
};

/**
 * Small size preset
 */
export const CircleChartSmall: React.FC<Omit<CircleChartProps, 'size' | 'strokeWidth'>> = (
  props
) => <CircleChart {...props} size={60} strokeWidth={6} />;

/**
 * Medium size preset (default)
 */
export const CircleChartMedium: React.FC<Omit<CircleChartProps, 'size' | 'strokeWidth'>> = (
  props
) => <CircleChart {...props} size={100} strokeWidth={8} />;

/**
 * Large size preset
 */
export const CircleChartLarge: React.FC<Omit<CircleChartProps, 'size' | 'strokeWidth'>> = (
  props
) => <CircleChart {...props} size={160} strokeWidth={12} />;

/**
 * Chart with percentage display
 */
export const CircleChartWithPercentage: React.FC<CircleChartProps> = (props) => (
  <CircleChart {...props} showPercentage />
);

/**
 * Multiple circle chart for layered progress
 *
 * @example
 * ```tsx
 * <MultiCircleChart
 *   values={[
 *     { value: 75, color: '#4caf50', label: 'Complete' },
 *     { value: 50, color: '#2196f3', label: 'In Progress' },
 *     { value: 25, color: '#ff9800', label: 'Pending' }
 *   ]}
 *   size={140}
 * />
 * ```
 */
export interface MultiCircleChartValue {
  value: number;
  color: string;
  label?: string;
}

export interface MultiCircleChartProps {
  values: MultiCircleChartValue[];
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  animated?: boolean;
  gap?: number;
}

export const MultiCircleChart: React.FC<MultiCircleChartProps> = ({
  values,
  size = 140,
  strokeWidth = 8,
  backgroundColor = '#e0e0e0',
  animated = true,
  gap = 4,
}) => {
  const totalLayers = values.length;

  return (
    <Container style={{ width: size, height: size }}>
      {values.map((item, index) => {
        const layerSize = size - (totalLayers - index - 1) * (strokeWidth + gap) * 2;
        const radius = (layerSize - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const clampedValue = Math.max(0, Math.min(100, item.value));
        const offset = circumference - (clampedValue / 100) * circumference;
        const center = size / 2;

        return (
          <Svg
            key={index}
            width={size}
            height={size}
            style={{ position: 'absolute' }}
            role="img"
            aria-label={`${item.label || `Layer ${index + 1}`}: ${clampedValue}%`}
          >
            {/* Background circle for this layer */}
            {index === totalLayers - 1 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={backgroundColor}
                strokeWidth={strokeWidth}
              />
            )}

            {/* Progress circle for this layer */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              $animated={animated}
            />
          </Svg>
        );
      })}
    </Container>
  );
};
