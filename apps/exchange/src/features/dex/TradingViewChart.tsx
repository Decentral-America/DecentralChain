/**
 * Price chart using lightweight-charts v5 — TradingView's open-source MIT library.
 * https://github.com/tradingview/lightweight-charts
 */

import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { logger } from '@/lib/logger';
import { candlesService } from '@/services/candlesService';
import { useDexStore } from '@/stores/dexStore';

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  background: #ffffff;
`;

const DEFAULT_RESOLUTION = '60';

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { selectedPair } = useDexStore();
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !selectedPair) return;

    setLoadingState('loading');
    setErrorMessage('');

    const chart = createChart(container, {
      autoSize: true,
      grid: {
        horzLines: { color: '#F3F4F6' },
        vertLines: { color: '#F3F4F6' },
      },
      layout: {
        background: { color: '#ffffff', type: ColorType.Solid },
        textColor: '#374151',
      },
      rightPriceScale: { borderColor: '#E5E7EB' },
      timeScale: {
        borderColor: '#E5E7EB',
        secondsVisible: false,
        timeVisible: true,
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
      downColor: '#EF4444',
      upColor: '#10B981',
      wickDownColor: '#EF4444',
      wickUpColor: '#10B981',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#10B98133',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { bottom: 0, top: 0.8 },
    });

    const symbolInfo = buildSymbolInfo();
    const amountId = selectedPair?.amountAsset ?? '';
    const priceId = selectedPair?.priceAsset ?? '';

    if (!symbolInfo || !amountId || !priceId) {
      setLoadingState('error');
      setErrorMessage(
        !amountId || !priceId
          ? 'No trading pairs configured for this network.'
          : 'No trading pair selected.',
      );
      return () => {
        chartRef.current = null;
        chart.remove();
      };
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - 90 * 24 * 60 * 60;

    candlesService.getBars(
      symbolInfo as Parameters<typeof candlesService.getBars>[0],
      DEFAULT_RESOLUTION,
      { firstDataRequest: true, from, to },
      (bars) => {
        try {
          const candles = bars
            .filter((b) => b.open != null && b.close != null)
            .map((b) => ({
              close: b.close as number,
              high: b.high as number,
              low: b.low as number,
              open: b.open as number,
              time: b.time as UTCTimestamp,
            }));

          const volumes = bars.map((b) => ({
            color: (b.close ?? 0) >= (b.open ?? 0) ? '#10B98133' : '#EF444433',
            time: b.time as UTCTimestamp,
            value: b.volume ?? 0,
          }));

          candleSeries.setData(candles);
          volumeSeries.setData(volumes);

          if (candles.length > 0) chart.timeScale().fitContent();
          setLoadingState(candles.length > 0 ? 'success' : 'error');
          if (candles.length === 0) setErrorMessage('No price history available for this pair.');
          logger.debug('[Chart] Loaded', candles.length, 'candles');
        } catch (err) {
          logger.error('[Chart] Failed to render candles:', err);
          setLoadingState('error');
          setErrorMessage('Failed to render price data.');
        }
      },
      (err) => {
        logger.error('[Chart] getBars error:', err);
        setLoadingState('error');
        setErrorMessage('Failed to load price data from data service.');
      },
    );

    return () => {
      chartRef.current = null;
      chart.remove();
    };
  }, [selectedPair, buildSymbolInfo]);

  return (
    <ChartContainer>
      <Box ref={containerRef} sx={{ height: '100%', width: '100%' }} />

      {loadingState === 'loading' && (
        <Box
          sx={{
            alignItems: 'center',
            background: '#ffffffcc',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          <CircularProgress size={36} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading chart...
          </Typography>
        </Box>
      )}

      {loadingState === 'error' && (
        <Box
          sx={{
            alignItems: 'center',
            background: '#ffffffcc',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          <Alert severity="warning" sx={{ maxWidth: 380 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              No chart data
            </Typography>
            <Typography variant="body2">
              {errorMessage || 'No price history available for this pair.'}
            </Typography>
          </Alert>
        </Box>
      )}
    </ChartContainer>
  );
};
