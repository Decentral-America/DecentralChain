/**
 * Inline trend line for list rows, after 21st.dev "Market Watchlist" by
 * @ssychui. Colour follows the trend; with no data it renders nothing, so a
 * row never shows a trend it does not have.
 */
import { useId } from 'react';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Fill under the line, faded to nothing. */
  area?: boolean;
}

export function Sparkline({ values, width = 72, height = 24, area = true }: SparklineProps) {
  const id = useId();
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = 2;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const up = (values.at(-1) ?? 0) >= (values[0] ?? 0);
  const hue = up ? 'var(--color-buy)' : 'var(--color-sell)';
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <title>{up ? 'Trending up' : 'Trending down'}</title>
      {area ? (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hue} stopOpacity="0.2" />
              <stop offset="100%" stopColor={hue} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
        </>
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={hue}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
