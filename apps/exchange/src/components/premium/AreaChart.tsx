/**
 * Area chart for balances and prices. The line colour follows the trend, the
 * fill fades to nothing, the high and low float at their real points instead
 * of a y-axis, and the plot can be scrubbed with a pointer, a finger or the
 * arrow keys. It only smooths when points crowd closer than two stroke widths;
 * otherwise it draws the real data.
 *
 * Ported from 21st.dev "Balance Chart" by @ssychui (demo 30538), rewired to
 * take real series instead of generating its own. With fewer than two points
 * it draws a calm baseline and says so, rather than inventing a market.
 */
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { chrome } from '@/styles/tokens';

const W = 640;
const STROKE = 2;

export interface AreaPoint {
  /** Epoch milliseconds or any monotonic x. */
  t: number;
  v: number;
}

export interface AreaChartProps {
  data: AreaPoint[];
  height?: number;
  /** Formats values in the readout and the floating extremes. */
  formatValue?: (v: number) => string;
  formatTime?: (t: number) => string;
  /** Shown over the baseline when there is nothing to draw. */
  emptyLabel?: string;
  /** Force a colour instead of following the trend. */
  tone?: 'up' | 'down' | 'accent';
  'aria-label'?: string;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  const at = (i: number) =>
    pts[Math.max(0, Math.min(pts.length - 1, i))] as { x: number; y: number };
  let d = `M${at(0).x.toFixed(2)},${at(0).y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(2)},${(p1.y + (p2.y - p0.y) / 6).toFixed(2)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(2)},${(p2.y - (p3.y - p1.y) / 6).toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

const Root = styled.div`
  position: relative;
  width: 100%;
  border-radius: 10px;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 3px ${({ theme }) => chrome[theme.mode].haloStrong};
  }
`;

const Extreme = styled.span`
  position: absolute;
  pointer-events: none;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Readout = styled.div`
  position: absolute;
  z-index: 2;
  pointer-events: none;
  padding: 6px 10px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => chrome[theme.mode].popoverShadow};

  strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text};
  }

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const EmptyNote = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100%);
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  pointer-events: none;
  white-space: nowrap;
`;

const defaultFormat = (v: number) =>
  v.toLocaleString(undefined, { maximumFractionDigits: v < 1 ? 6 : 2 });
const defaultTime = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });

export function AreaChart({
  data,
  height = 220,
  formatValue = defaultFormat,
  formatTime = defaultTime,
  emptyLabel = 'No history yet',
  tone,
  'aria-label': ariaLabel = 'Chart',
}: AreaChartProps) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [plotW, setPlotW] = useState(W);
  const H = height;

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setPlotW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const empty = n < 2;

  const chart = useMemo(() => {
    if (empty) return null;
    const vals = data.map((d) => d.v);
    const smooth = plotW / (n - 1) < 2 * STROKE;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const nx = (i: number) => (i / (n - 1)) * W;
    const ny = (v: number) => H - 14 - ((v - lo) / (hi - lo || 1)) * (H - 44);
    const xy = vals.map((v, i) => ({ x: nx(i), y: hi === lo ? H / 2 : ny(v) }));
    const path = smooth
      ? smoothPath(xy)
      : xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return {
      area: `${path} L${W},${H} L0,${H} Z`,
      iMax: vals.indexOf(hi),
      iMin: vals.indexOf(lo),
      max: hi,
      min: lo,
      path,
      pts: xy,
      up: (vals[n - 1] ?? 0) >= (vals[0] ?? 0),
    };
  }, [data, empty, n, plotW, H]);

  const hue =
    tone === 'accent'
      ? 'var(--color-indigo-ink)'
      : tone === 'down' || (tone === undefined && chart && !chart.up)
        ? 'var(--color-sell)'
        : 'var(--color-buy)';

  const scrubTo = (clientX: number) => {
    if (!svgRef.current || empty) return;
    const rect = svgRef.current.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left) / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const edge = (x: number) => {
    const pct = (x / W) * 100;
    if (pct <= 12) return { left: 0 };
    if (pct >= 88) return { right: 0 };
    return { left: `${pct}%`, transform: 'translateX(-50%)' };
  };

  const hovered = hover != null && chart ? chart.pts[hover] : undefined;
  const hoveredDatum = hover != null ? data[hover] : undefined;
  const hi = chart ? chart.pts[chart.iMax] : undefined;
  const lo = chart ? chart.pts[chart.iMin] : undefined;

  return (
    <Root
      tabIndex={empty ? -1 : 0}
      role="group"
      aria-label={`${ariaLabel}. Use the left and right arrow keys to read values.`}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (empty) return;
        const at = hover ?? n - 1;
        const step = e.shiftKey ? 10 : 1;
        const next =
          e.key === 'ArrowLeft'
            ? at - step
            : e.key === 'ArrowRight'
              ? at + step
              : e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? n - 1
                  : null;
        if (e.key === 'Escape') setHover(null);
        if (next === null) return;
        e.preventDefault();
        setHover(Math.max(0, Math.min(n - 1, next)));
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        style={{
          cursor: empty ? 'default' : 'crosshair',
          height: H,
          touchAction: 'pan-y',
          width: '100%',
        }}
        onPointerDown={(e) => scrubTo(e.clientX)}
        onPointerMove={(e) => scrubTo(e.clientX)}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setHover(null);
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue} stopOpacity="0.18" />
            <stop offset="100%" stopColor={hue} stopOpacity="0" />
          </linearGradient>
        </defs>
        {chart ? (
          <>
            <path d={chart.area} fill={`url(#${gradientId})`} />
            <path
              d={chart.path}
              fill="none"
              stroke={hue}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <line
            x1={0}
            x2={W}
            y1={H * 0.62}
            y2={H * 0.62}
            stroke="var(--border-strong)"
            strokeWidth={1.5}
            strokeDasharray="4 6"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {empty ? <EmptyNote>{emptyLabel}</EmptyNote> : null}

      {chart && hi && lo && chart.max !== chart.min ? (
        <>
          <Extreme
            style={{
              ...edge(hi.x),
              marginTop: -18,
              top: `${(hi.y / H) * 100}%`,
            }}
          >
            {formatValue(chart.max)}
          </Extreme>
          <Extreme
            style={{
              ...edge(lo.x),
              marginTop: 8,
              top: `${(lo.y / H) * 100}%`,
            }}
          >
            {formatValue(chart.min)}
          </Extreme>
        </>
      ) : null}

      {hovered && hoveredDatum ? (
        <>
          <i
            aria-hidden
            style={{
              borderLeft: '1px dashed var(--border-strong)',
              bottom: 0,
              left: `${(hovered.x / W) * 100}%`,
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
            }}
          />
          <i
            aria-hidden
            style={{
              background: hue,
              borderRadius: '50%',
              boxShadow: '0 0 0 2px var(--surface-canvas)',
              height: 8,
              left: `${(hovered.x / W) * 100}%`,
              pointerEvents: 'none',
              position: 'absolute',
              top: `${(hovered.y / H) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 8,
            }}
          />
          <Readout
            role="status"
            style={{
              left: `${(hovered.x / W) * 100}%`,
              top: `clamp(2px, calc(${(hovered.y / H) * 100}% - 22px), calc(100% - 52px))`,
              transform:
                hovered.x / W < 0.5 ? 'translateX(14px)' : 'translateX(calc(-100% - 14px))',
            }}
          >
            <strong>{formatValue(hoveredDatum.v)}</strong>
            <span>{formatTime(hoveredDatum.t)}</span>
          </Readout>
        </>
      ) : null}
    </Root>
  );
}
