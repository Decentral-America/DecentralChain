import React, { useMemo } from 'react';
import styled from 'styled-components';

/**
 * Container for the chart
 */
const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 200px;
`;

/**
 * SVG chart element
 */
const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

/**
 * Chart path element with animation
 */
const ChartPath = styled.path<{ $color?: string }>`
  fill: none;
  stroke: ${(props) => props.$color || '#1f77b4'};
  stroke-width: 2;
  transition: d 0.3s ease;
`;

/**
 * Area fill under the chart
 */
const ChartArea = styled.path<{ $color?: string }>`
  fill: ${(props) => props.$color || 'rgba(31, 119, 180, 0.1)'};
  transition: d 0.3s ease;
`;

/**
 * Grid line styling
 */
const GridLine = styled.line`
  stroke: #e0e0e0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
`;

/**
 * Axis label styling
 */
const AxisLabel = styled.text`
  font-size: 12px;
  fill: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

/**
 * Data point for tooltip
 */
const DataPoint = styled.circle`
  fill: white;
  stroke: ${(props) => props.color || '#1f77b4'};
  stroke-width: 2;
  cursor: pointer;
  transition: r 0.2s ease;

  &:hover {
    r: 6;
  }
`;

/**
 * Tooltip container
 */
const Tooltip = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: absolute;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid rgba(0, 0, 0, 0.8);
  }
`;

/**
 * Data point for the chart
 */
export interface DataPoint {
  /**
   * Timestamp in milliseconds
   */
  timestamp: number;

  /**
   * Rate value
   */
  rate: number;

  /**
   * Optional label for the data point
   */
  label?: string;
}

/**
 * Props for AssetRateChart component
 */
export interface AssetRateChartProps {
  /**
   * Array of data points to display
   */
  data: DataPoint[];

  /**
   * Chart line color
   * @default '#1f77b4'
   */
  lineColor?: string;

  /**
   * Chart area fill color (under the line)
   * @default 'rgba(31, 119, 180, 0.1)'
   */
  areaColor?: string;

  /**
   * Height of the chart in pixels
   * @default 300
   */
  height?: number;

  /**
   * Width of the chart in pixels
   * @default '100%'
   */
  width?: string | number;

  /**
   * Show grid lines
   * @default true
   */
  showGrid?: boolean;

  /**
   * Number of grid lines on Y axis
   * @default 5
   */
  gridLines?: number;

  /**
   * Show X axis labels
   * @default true
   */
  showXAxis?: boolean;

  /**
   * Show Y axis labels
   * @default true
   */
  showYAxis?: boolean;

  /**
   * Format date label
   */
  formatDate?: (timestamp: number) => string;

  /**
   * Format rate label
   */
  formatRate?: (rate: number) => string;

  /**
   * Show tooltips on hover
   * @default true
   */
  showTooltip?: boolean;

  /**
   * Smooth curve (Bezier)
   * @default true
   */
  smooth?: boolean;

  /**
   * Show data points
   * @default false
   */
  showPoints?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Asset rate chart component with historical data visualization
 *
 * Displays a line chart showing asset rate changes over time.
 * Supports grid lines, axis labels, tooltips, and smooth curves.
 *
 * @example
 * ```tsx
 * const data = [
 *   { timestamp: Date.now() - 86400000 * 7, rate: 100 },
 *   { timestamp: Date.now() - 86400000 * 6, rate: 110 },
 *   { timestamp: Date.now() - 86400000 * 5, rate: 105 },
 *   { timestamp: Date.now(), rate: 120 }
 * ];
 *
 * <AssetRateChart data={data} height={400} />
 * ```
 *
 * @example With custom colors and formatting
 * ```tsx
 * <AssetRateChart
 *   data={data}
 *   lineColor="#4caf50"
 *   areaColor="rgba(76, 175, 80, 0.2)"
 *   formatDate={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
 *   formatRate={(rate) => `$${rate.toFixed(2)}`}
 * />
 * ```
 */
export const AssetRateChart: React.FC<AssetRateChartProps> = ({
  data,
  lineColor = '#1f77b4',
  areaColor = 'rgba(31, 119, 180, 0.1)',
  height = 300,
  width = '100%',
  showGrid = true,
  gridLines = 5,
  showXAxis = true,
  showYAxis = true,
  formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  formatRate = (rate) => rate.toFixed(2),
  showTooltip = true,
  smooth = true,
  showPoints = false,
  className,
}) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

  // Calculate chart dimensions and scales
  const { viewBox, scales, path, areaPath, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { areaPath: '', path: '', points: [], scales: null, viewBox: '0 0 100 100' };
    }

    const padding = { bottom: 40, left: 60, right: 20, top: 20 };
    const chartWidth = 800;
    const chartHeight = height;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Find min/max values
    const rates = data.map((d) => d.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const rateRange = maxRate - minRate || 1;

    const timestamps = data.map((d) => d.timestamp);
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    const timeRange = maxTimestamp - minTimestamp || 1;

    // Scale functions
    const scaleX = (timestamp: number) =>
      padding.left + ((timestamp - minTimestamp) / timeRange) * innerWidth;

    const scaleY = (rate: number) =>
      padding.top + innerHeight - ((rate - minRate) / rateRange) * innerHeight;

    // Generate path points
    const pathPoints = data.map((d) => ({ x: scaleX(d.timestamp), y: scaleY(d.rate) }));

    // Generate smooth path (Bezier curves)
    let pathD = `M ${pathPoints[0]?.x} ${pathPoints[0]?.y}`;

    if (smooth && pathPoints.length > 2) {
      for (let i = 1; i < pathPoints.length; i++) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        const next = pathPoints[i + 1];

        if (!prev || !curr) continue;

        if (next) {
          const cp1x = prev.x + (curr.x - prev.x) * 0.5;
          const cp1y = prev.y;
          const cp2x = curr.x - (next.x - curr.x) * 0.5;
          const cp2y = curr.y;
          pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
          pathD += ` L ${curr.x} ${curr.y}`;
        }
      }
    } else {
      // Straight lines
      for (let i = 1; i < pathPoints.length; i++) {
        pathD += ` L ${pathPoints[i]?.x} ${pathPoints[i]?.y}`;
      }
    }

    // Generate area path (fill under line)
    const areaD = `${pathD} L ${pathPoints[pathPoints.length - 1]?.x} ${
      padding.top + innerHeight
    } L ${pathPoints[0]?.x} ${padding.top + innerHeight} Z`;

    return {
      areaPath: areaD,
      path: pathD,
      points: pathPoints,
      scales: {
        innerHeight,
        innerWidth,
        maxRate,
        maxTimestamp,
        minRate,
        minTimestamp,
        padding,
        x: scaleX,
        y: scaleY,
      },
      viewBox: `0 0 ${chartWidth} ${chartHeight}`,
    };
  }, [data, height, smooth]);

  // Handle point hover
  const handlePointHover = (index: number, event: React.MouseEvent) => {
    setHoveredPoint(index);
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
    if (containerRect) {
      setTooltipPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    }
  };

  if (!scales) {
    return (
      <ChartContainer className={className}>
        <div style={{ color: '#999', paddingTop: '80px', textAlign: 'center' }}>
          No data available
        </div>
      </ChartContainer>
    );
  }

  const { padding, innerWidth, innerHeight, minRate, maxRate } = scales;

  return (
    <ChartContainer className={className} style={{ height, width }}>
      <ChartSvg viewBox={viewBox} preserveAspectRatio="none">
        {/* Grid lines */}
        {showGrid &&
          Array.from({ length: gridLines }).map((_, i) => {
            const y = padding.top + (innerHeight / (gridLines - 1)) * i;
            return (
              <GridLine key={y} x1={padding.left} y1={y} x2={padding.left + innerWidth} y2={y} />
            );
          })}

        {/* Y axis labels */}
        {showYAxis &&
          Array.from({ length: gridLines }).map((_, i) => {
            const rate = maxRate - (maxRate - minRate) * (i / (gridLines - 1));
            const y = padding.top + (innerHeight / (gridLines - 1)) * i;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static axis labels never reordered
              <AxisLabel key={`y-label-${i}`} x={padding.left - 10} y={y + 4} textAnchor="end">
                {formatRate(rate)}
              </AxisLabel>
            );
          })}

        {/* X axis labels */}
        {showXAxis &&
          data.map((d, i) => {
            if (i % Math.ceil(data.length / 6) !== 0) return null; // Show ~6 labels
            const x = scales.x(d.timestamp);
            return (
              <AxisLabel
                key={`x-label-${d.timestamp}`}
                x={x}
                y={padding.top + innerHeight + 20}
                textAnchor="middle"
              >
                {formatDate(d.timestamp)}
              </AxisLabel>
            );
          })}

        {/* Area fill */}
        <ChartArea d={areaPath} $color={areaColor} />

        {/* Line path */}
        <ChartPath d={path} $color={lineColor} />

        {/* Data points */}
        {(showPoints || showTooltip) &&
          data.map((d, i) => (
            <DataPoint
              key={`point-${d.timestamp}`}
              cx={points[i]?.x}
              cy={points[i]?.y}
              r={showPoints ? 4 : 0}
              color={lineColor}
              onMouseEnter={(e) => handlePointHover(i, e)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ opacity: showPoints ? 1 : 0 }}
            />
          ))}
      </ChartSvg>

      {/* Tooltip */}
      {showTooltip && hoveredPoint !== null && (
        <Tooltip $x={tooltipPos.x} $y={tooltipPos.y} $visible={hoveredPoint !== null}>
          <div>
            <strong>{formatDate(data[hoveredPoint]?.timestamp ?? 0)}</strong>
          </div>
          <div>Rate: {formatRate(data[hoveredPoint]?.rate ?? 0)}</div>
          {data[hoveredPoint]?.label && <div>{data[hoveredPoint]?.label}</div>}
        </Tooltip>
      )}
    </ChartContainer>
  );
};

/**
 * Convenience component for small asset rate chart
 */
export const AssetRateChartSmall: React.FC<Omit<AssetRateChartProps, 'height'>> = (props) => (
  <AssetRateChart {...props} height={150} showGrid={false} showXAxis={false} showYAxis={false} />
);

/**
 * Convenience component for compact asset rate chart
 */
export const AssetRateChartCompact: React.FC<Omit<AssetRateChartProps, 'height'>> = (props) => (
  <AssetRateChart {...props} height={200} gridLines={3} />
);
