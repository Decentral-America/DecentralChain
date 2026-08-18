/**
 * Price chart using lightweight-charts v5 — TradingView's open-source MIT library.
 * https://github.com/tradingview/lightweight-charts
 */

import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from 'lightweight-charts';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { logger } from '@/lib/logger';
import { candlesService } from '@/services/candlesService';
import { selectSelectedPair, useDexStore } from '@/stores/dexStore';
import {
  CHART_RESOLUTIONS,
  type ChartType,
  DEFAULT_RESOLUTION,
  historyStartSeconds,
  MOVING_AVERAGES,
  movingAverage,
} from './chartConfig';

const ChartContainer = styled.div<{ $bg: string; $fullscreen: boolean }>`
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: ${(p) => (p.$fullscreen ? 'fixed' : 'relative')};
  inset: ${(p) => (p.$fullscreen ? '0' : 'auto')};
  z-index: ${(p) => (p.$fullscreen ? 1300 : 'auto')};
  display: flex;
  flex-direction: column;
  background: ${(p) => p.$bg};
`;

/**
 * The price series in whichever form it is currently drawn.
 *
 * Spelled as a union of concrete series types rather than
 * `ISeriesApi<'Candlestick' | 'Line' | 'Area'>`: the generic distributes into
 * the method parameters, which collapses `createPriceLine` and `setData` to
 * `never` and makes them uncallable.
 */
type PriceSeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'>;

/** One bar, normalised out of whatever `candlesService` returns. */
interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Values shown in the legend — either the hovered bar or the most recent one. */
interface LegendValues extends Bar {
  changePercent: number | null;
}

/** How often the visible timeframe is re-fetched so the newest bar stays current. */
const LIVE_REFRESH_MS = 15_000;

export const TradingViewChart: React.FC = () => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // The price series, whichever form it currently takes. Held so the polling
  // effect can push updates without tearing the chart down.
  const priceSeriesRef = useRef<PriceSeries | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const barsRef = useRef<Bar[]>([]);

  const selectedPair = useDexStore(selectSelectedPair);
  const [resolution, setResolution] = useState<string>(DEFAULT_RESOLUTION);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [showMa, setShowMa] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [legend, setLegend] = useState<LegendValues | null>(null);

  const upColor = theme.palette.success.main;
  const downColor = theme.palette.error.main;

  const amountName = selectedPair?.amountAssetName || selectedPair?.amountAsset || '';
  const priceName = selectedPair?.priceAssetName || selectedPair?.priceAsset || '';

  const resolutionMinutes = useMemo(
    () => CHART_RESOLUTIONS.find((r) => r.value === resolution)?.minutes ?? 60,
    [resolution],
  );

  const buildSymbolInfo = useCallback(() => {
    if (!selectedPair) return null;
    return {
      _dccData: {
        amountAsset: { id: selectedPair.amountAsset },
        priceAsset: { id: selectedPair.priceAsset },
      },
      name: `${selectedPair.amountAsset}/${selectedPair.priceAsset}`,
    };
  }, [selectedPair]);

  /** Normalise the service's bars, dropping any without a usable price. */
  const toBars = useCallback((raw: Parameters<Parameters<typeof candlesService.getBars>[3]>[0]) => {
    return raw
      .filter((b) => b.open != null && b.close != null && b.high != null && b.low != null)
      .map((b) => ({
        close: b.close as number,
        high: b.high as number,
        low: b.low as number,
        open: b.open as number,
        time: b.time as number,
        volume: b.volume ?? 0,
      }))
      .sort((a, b) => a.time - b.time);
  }, []);

  /** Push a full bar set into whichever series are currently mounted. */
  const applyBars = useCallback(
    (bars: Bar[]) => {
      const priceSeries = priceSeriesRef.current;
      const volumeSeries = volumeSeriesRef.current;
      if (!priceSeries || !volumeSeries) return;

      if (chartType === 'candles') {
        priceSeries.setData(
          bars.map((b) => ({
            close: b.close,
            high: b.high,
            low: b.low,
            open: b.open,
            time: b.time as UTCTimestamp,
          })),
        );
      } else {
        priceSeries.setData(bars.map((b) => ({ time: b.time as UTCTimestamp, value: b.close })));
      }

      volumeSeries.setData(
        bars.map((b) => ({
          color: b.close >= b.open ? `${upColor}33` : `${downColor}33`,
          time: b.time as UTCTimestamp,
          value: b.volume,
        })),
      );

      maSeriesRef.current.forEach((series, index) => {
        const config = MOVING_AVERAGES[index];
        if (!config) return;
        series.setData(
          movingAverage(bars, config.period).map((p) => ({
            time: p.time as UTCTimestamp,
            value: p.value,
          })),
        );
      });
    },
    [chartType, upColor, downColor],
  );

  // Build the chart. Re-runs when the pair, the drawn form, the MA toggle or
  // the theme changes — each of those alters series construction, which
  // lightweight-charts cannot mutate in place.
  useEffect(() => {
    // Per-effect mounted flag — guards the race where a new effect run creates
    // a new chart while the previous getBars callback is still in flight.
    // chartRef.current would already point at the NEW chart, so checking it
    // alone is not enough; this flag is tied to THIS run's lifetime.
    let effectMounted = true;

    const container = containerRef.current;
    if (!container) return;

    if (!selectedPair) {
      setLoadingState('error');
      setErrorMessage('No trading pairs configured for this network.');
      return;
    }

    setLoadingState('loading');
    setErrorMessage('');
    setLegend(null);

    const chart = createChart(container, {
      autoSize: true,
      crosshair: {
        horzLine: {
          color: theme.palette.text.secondary,
          labelBackgroundColor: theme.palette.primary.main,
        },
        vertLine: {
          color: theme.palette.text.secondary,
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
      grid: {
        horzLines: { color: theme.palette.divider },
        vertLines: { color: theme.palette.divider },
      },
      layout: {
        background: { color: theme.palette.background.paper, type: ColorType.Solid },
        textColor: theme.palette.text.secondary,
      },
      rightPriceScale: { borderColor: theme.palette.divider },
      timeScale: {
        borderColor: theme.palette.divider,
        secondsVisible: false,
        timeVisible: resolutionMinutes < 1440,
      },
    });
    chartRef.current = chart;

    const priceSeries =
      chartType === 'candles'
        ? chart.addSeries(CandlestickSeries, {
            borderVisible: false,
            downColor,
            upColor,
            wickDownColor: downColor,
            wickUpColor: upColor,
          })
        : chartType === 'line'
          ? chart.addSeries(LineSeries, { color: theme.palette.primary.main, lineWidth: 2 })
          : chart.addSeries(AreaSeries, {
              bottomColor: `${theme.palette.primary.main}05`,
              lineColor: theme.palette.primary.main,
              lineWidth: 2,
              topColor: `${theme.palette.primary.main}55`,
            });
    priceSeriesRef.current = priceSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: `${upColor}33`,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeriesRef.current = volumeSeries;
    chart.priceScale('volume').applyOptions({ scaleMargins: { bottom: 0, top: 0.8 } });

    maSeriesRef.current = showMa
      ? MOVING_AVERAGES.map((ma) =>
          chart.addSeries(LineSeries, {
            color: ma.color,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            lineWidth: 1,
            priceLineVisible: false,
            title: `MA${ma.period}`,
          }),
        )
      : [];

    // Legend follows the crosshair, and falls back to the newest bar when the
    // pointer leaves the chart so the header is never blank.
    const onCrosshairMove: Parameters<typeof chart.subscribeCrosshairMove>[0] = (param) => {
      if (!effectMounted) return;
      const bars = barsRef.current;
      if (bars.length === 0) return;

      const hovered = param.time
        ? bars.find((b) => b.time === (param.time as number))
        : bars[bars.length - 1];
      if (!hovered) return;

      setLegend({
        ...hovered,
        changePercent:
          hovered.open > 0 ? ((hovered.close - hovered.open) / hovered.open) * 100 : null,
      });
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    const symbolInfo = buildSymbolInfo();
    const amountId = selectedPair.amountAsset;
    const priceId = selectedPair.priceAsset;

    const teardown = () => {
      effectMounted = false;
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chartRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      maSeriesRef.current = [];
      try {
        chart.remove();
      } catch {
        // RAF may fire after remove — ignore
      }
    };

    if (!symbolInfo || !amountId || !priceId) {
      setLoadingState('error');
      setErrorMessage('No trading pairs configured for this network.');
      return teardown;
    }

    const to = Math.floor(Date.now() / 1000);
    const from = historyStartSeconds(to, resolutionMinutes);

    candlesService.getBars(
      symbolInfo as Parameters<typeof candlesService.getBars>[0],
      resolution,
      { firstDataRequest: true, from, to },
      (raw) => {
        if (!effectMounted) return;
        try {
          const bars = toBars(raw);
          barsRef.current = bars;
          applyBars(bars);

          const latest = bars[bars.length - 1];
          if (latest) {
            // A dashed line at the last traded price, so the current level is
            // readable without hovering.
            priceSeries.createPriceLine({
              axisLabelVisible: true,
              color: latest.close >= latest.open ? upColor : downColor,
              lineStyle: LineStyle.Dashed,
              lineWidth: 1,
              price: latest.close,
              title: 'Last',
            });
            setLegend({
              ...latest,
              changePercent:
                latest.open > 0 ? ((latest.close - latest.open) / latest.open) * 100 : null,
            });
          }

          if (bars.length > 0) chart.timeScale().fitContent();
          setLoadingState(bars.length > 0 ? 'success' : 'empty');
          logger.debug('[Chart] Loaded', bars.length, 'bars at', resolution);
        } catch (err) {
          logger.error('[Chart] Failed to render candles:', err);
          setLoadingState('error');
          setErrorMessage('Failed to render price data.');
        }
      },
      (err) => {
        if (!effectMounted) return;
        logger.error('[Chart] getBars error:', err);
        setLoadingState('error');
        setErrorMessage('Failed to load price data from data service.');
      },
    );

    return teardown;
  }, [
    selectedPair,
    buildSymbolInfo,
    resolution,
    resolutionMinutes,
    chartType,
    showMa,
    theme,
    upColor,
    downColor,
    toBars,
    applyBars,
  ]);

  // Keep the newest bar current without rebuilding the chart. Re-fetches the
  // visible window and re-applies it; `setData` on an unchanged series is
  // cheap, and this avoids the flicker of a full remount every 15s.
  useEffect(() => {
    if (loadingState === 'error' || !selectedPair) return;

    const tick = () => {
      const symbolInfo = buildSymbolInfo();
      if (!symbolInfo || !priceSeriesRef.current) return;

      const to = Math.floor(Date.now() / 1000);
      const from = historyStartSeconds(to, resolutionMinutes);

      candlesService.getBars(
        symbolInfo as Parameters<typeof candlesService.getBars>[0],
        resolution,
        { firstDataRequest: false, from, to },
        (raw) => {
          if (!priceSeriesRef.current) return;
          const bars = toBars(raw);
          if (bars.length === 0) return;
          barsRef.current = bars;
          applyBars(bars);
        },
        () => {
          // A failed refresh leaves the last good render in place; the next
          // tick retries. Surfacing an error here would replace a usable chart
          // with an alert over a transient blip.
        },
      );
    };

    const id = setInterval(tick, LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, [
    selectedPair,
    buildSymbolInfo,
    resolution,
    resolutionMinutes,
    loadingState,
    toBars,
    applyBars,
  ]);

  // Escape leaves fullscreen — matching what the key does everywhere else.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const priceDecimals = 8;
  const fmt = (value: number) => value.toFixed(priceDecimals).replace(/0+$/, '').replace(/\.$/, '');

  return (
    <ChartContainer $bg={theme.palette.background.paper} $fullscreen={fullscreen}>
      {/* Toolbar */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: 1,
          px: 1,
          py: 0.5,
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={resolution}
          onChange={(_e, value: string | null) => value && setResolution(value)}
          aria-label="Chart timeframe"
        >
          {CHART_RESOLUTIONS.map((r) => (
            <ToggleButton key={r.value} value={r.value} sx={{ px: 1, py: 0.25 }}>
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={chartType}
          onChange={(_e, value: ChartType | null) => value && setChartType(value)}
          aria-label="Chart type"
        >
          <ToggleButton value="candles" sx={{ px: 1, py: 0.25 }}>
            Candles
          </ToggleButton>
          <ToggleButton value="line" sx={{ px: 1, py: 0.25 }}>
            Line
          </ToggleButton>
          <ToggleButton value="area" sx={{ px: 1, py: 0.25 }}>
            Area
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButton
          selected={showMa}
          size="small"
          value="ma"
          onChange={() => setShowMa((v) => !v)}
          sx={{ px: 1, py: 0.25 }}
          aria-label="Toggle moving averages"
        >
          MA
        </ToggleButton>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
          <ToggleButton
            selected={fullscreen}
            size="small"
            value="fullscreen"
            onChange={() => setFullscreen((v) => !v)}
            sx={{ px: 1, py: 0.25 }}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? (
              <CloseFullscreenIcon fontSize="small" />
            ) : (
              <OpenInFullIcon fontSize="small" />
            )}
          </ToggleButton>
        </Tooltip>
      </Stack>

      {/* Legend — OHLCV for the hovered (or latest) bar */}
      {legend && loadingState === 'success' && (
        <Stack
          direction="row"
          sx={{ flexWrap: 'wrap', gap: 1.5, left: 12, position: 'absolute', top: 48, zIndex: 2 }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {amountName}/{priceName}
          </Typography>
          {(
            [
              ['O', legend.open],
              ['H', legend.high],
              ['L', legend.low],
              ['C', legend.close],
            ] as const
          ).map(([label, value]) => (
            <Typography key={label} variant="caption" sx={{ color: 'text.secondary' }}>
              {label}{' '}
              <Box
                component="span"
                sx={{ color: legend.close >= legend.open ? 'success.main' : 'error.main' }}
              >
                {fmt(value)}
              </Box>
            </Typography>
          ))}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Vol <Box component="span">{legend.volume.toLocaleString('en-US')}</Box>
          </Typography>
          {legend.changePercent !== null && (
            <Typography
              variant="caption"
              sx={{ color: legend.changePercent >= 0 ? 'success.main' : 'error.main' }}
            >
              {legend.changePercent >= 0 ? '+' : ''}
              {legend.changePercent.toFixed(2)}%
            </Typography>
          )}
        </Stack>
      )}

      <Box ref={containerRef} sx={{ flexGrow: 1, minHeight: 0, width: '100%' }} />

      {loadingState === 'loading' && (
        <Overlay>
          <CircularProgress size={36} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading chart…
          </Typography>
        </Overlay>
      )}

      {loadingState === 'empty' && (
        <Overlay>
          <Alert severity="info" sx={{ maxWidth: 420 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              No trades yet
            </Typography>
            <Typography variant="body2">
              {amountName && priceName
                ? `${amountName}/${priceName} has no trades in this timeframe. The order book is still live — try a wider timeframe.`
                : 'This pair has no trades in the selected timeframe.'}
            </Typography>
          </Alert>
        </Overlay>
      )}

      {loadingState === 'error' && (
        <Overlay>
          <Alert severity="warning" sx={{ maxWidth: 420 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              Chart unavailable
            </Typography>
            <Typography variant="body2">
              {errorMessage || 'No price history available for this pair.'}
            </Typography>
          </Alert>
        </Overlay>
      )}
    </ChartContainer>
  );
};

/** Centred overlay used by the loading, empty and error states. */
const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      alignItems: 'center',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      inset: 0,
      justifyContent: 'center',
      opacity: 0.92,
      position: 'absolute',
      top: 40,
    }}
  >
    {children}
  </Box>
);
