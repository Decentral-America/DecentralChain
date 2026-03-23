/**
 * TradingViewChart Component
 * Full TradingView charting library implementation matching Angular version
 * Uses custom DecentralChain datafeed for real-time candle data
 */

import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { logger } from '@/lib/logger';
import { candlesService } from '@/services/candlesService';
import { useDexStore } from '@/stores/dexStore';

/**
 * Chart container
 */
const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// TradingView widget type (loaded dynamically)
declare const TradingView: {
  widget: new (config: Record<string, unknown>) => TradingViewWidget;
};

interface TradingViewWidget {
  onChartReady(callback: () => void): void;
  remove(): void;
}

let counter = 0;
let loadPromise: Promise<void> | null = null;

/**
 * Load TradingView charting library
 * Tries multiple sources: public folder, proxy, and external CDN
 */
const loadTradingViewLibrary = (): Promise<void> => {
  if (loadPromise !== null) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof TradingView !== 'undefined') {
      resolve();
      return;
    }

    // Try loading from public folder (copied during build)
    const tryLoadFromPublic = () => {
      return new Promise<void>((resolvePublic, rejectPublic) => {
        const script = document.createElement('script');
        script.src = '/trading-view/charting_library.min.js';
        script.async = true;
        script.onload = () => {
          logger.debug('[TradingView] Loaded from public folder');
          resolvePublic();
        };
        script.onerror = () => {
          logger.warn('[TradingView] Failed to load from public folder, trying proxy...');
          rejectPublic(new Error('public folder load failed'));
        };
        document.head.appendChild(script);
      });
    };

    // Try loading from proxy (vite proxy to charts.decentral.exchange)
    const tryLoadFromProxy = () => {
      return new Promise<void>((resolveProxy, rejectProxy) => {
        const script = document.createElement('script');
        script.src = '/trading-view/charting_library.standalone.js';
        script.async = true;
        script.onload = () => {
          logger.debug('[TradingView] Loaded from proxy');
          resolveProxy();
        };
        script.onerror = () => {
          logger.warn('[TradingView] Failed to load from proxy, trying external CDN...');
          rejectProxy(new Error('proxy load failed'));
        };
        document.head.appendChild(script);
      });
    };

    // Try loading from external CDN (fallback)
    const tryLoadFromCDN = () => {
      return new Promise<void>((resolveCDN, rejectCDN) => {
        const script = document.createElement('script');
        script.src = 'https://charts.decentral.exchange/charting_library.min.js';
        script.async = true;
        script.onload = () => {
          logger.debug('[TradingView] Loaded from external CDN');
          resolveCDN();
        };
        script.onerror = () => {
          logger.error('[TradingView] All loading attempts failed');
          rejectCDN(new Error('All TradingView loading sources failed'));
        };
        document.head.appendChild(script);
      });
    };

    // Try sources in order: public folder -> proxy -> external CDN
    void (async () => {
      try {
        await tryLoadFromPublic();
        resolve();
      } catch {
        try {
          await tryLoadFromProxy();
          resolve();
        } catch {
          try {
            await tryLoadFromCDN();
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      }
    })();
  });

  return loadPromise;
};

/**
 * TradingViewChart Component
 */
export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<TradingViewWidget | null>(null);
  const elementIdRef = useRef(`tradingview${counter++}`);
  const { selectedPair } = useDexStore();
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const initChart = async () => {
      try {
        setLoadingState('loading');

        // Load library
        await loadTradingViewLibrary();

        if (!isMounted || !containerRef.current || !selectedPair) return;

        // Create symbol from pair
        const symbol = `${selectedPair.amountAsset}/${selectedPair.priceAsset}`;

        // Create TradingView widget
        chartRef.current = new TradingView.widget({
          autosize: true,
          container: elementIdRef.current, // Changed from container_id (deprecated)
          datafeed: candlesService,
          disabled_features: [
            'header_screenshot',
            'header_symbol_search',
            'symbol_search_hot_key',
            'display_market_status',
            'control_bar',
            'timeframes_toolbar',
            'volume_force_overlay',
            'header_compare',
          ],
          interval: 'D',
          library_path: '/trading-view/',
          locale: 'en',
          overrides: {
            'mainSeriesProperties.candleStyle.downColor': '#EF4444',
            'mainSeriesProperties.candleStyle.drawBorder': false,
            'mainSeriesProperties.candleStyle.upColor': '#10B981',
            'mainSeriesProperties.candleStyle.wickDownColor': '#EF4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#10B981',
            'paneProperties.background': '#ffffff',
            // Grid color removed - path doesn't exist in this version
            volumePaneSize: 'medium',
          },
          studies_overrides: {
            'volume.volume.color.0': '#EF4444',
            'volume.volume.color.1': '#10B981',
          },
          symbol,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          toolbar_bg: '#ffffff',
        });

        chartRef.current.onChartReady(() => {
          logger.debug('[TradingView] Chart ready for:', symbol);
          if (isMounted) {
            setLoadingState('success');
          }
        });
      } catch (error) {
        logger.error('[TradingView] Failed to initialize:', error);
        if (isMounted) {
          setLoadingState('error');
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load chart');
        }
      }
    };

    void initChart();

    return () => {
      isMounted = false;
      candlesService.unsubscribeBars();
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // Ignore removal errors
        }
        chartRef.current = null;
      }
    };
  }, [selectedPair]);

  return (
    <ChartContainer>
      {loadingState === 'loading' && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading chart...
          </Typography>
        </Box>
      )}

      {loadingState === 'error' && (
        <Alert severity="error" sx={{ maxWidth: 400, width: '100%' }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Chart Load Failed
          </Typography>
          <Typography variant="body2">{errorMessage || 'Unable to load trading chart'}</Typography>
        </Alert>
      )}

      <div
        id={elementIdRef.current}
        style={{
          display: loadingState === 'success' ? 'block' : 'none',
          height: '100%',
          width: '100%',
        }}
        ref={containerRef}
      />
    </ChartContainer>
  );
};
