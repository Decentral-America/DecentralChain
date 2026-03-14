/**
 * TradingViewChart Component
 * Full TradingView charting library implementation matching Angular version
 * Uses custom DecentralChain datafeed for real-time candle data
 */
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDexStore } from '@/stores/dexStore';
import { candlesService } from '@/services/candlesService';
import { Alert, CircularProgress, Box, Typography } from '@mui/material';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const TradingView: any;

let counter = 0;
let loadPromise: Promise<void> | null = null;

/**
 * Load TradingView charting library
 * Tries multiple sources: public folder, proxy, and external CDN
 */
const loadTradingViewLibrary = (): Promise<void> => {
  if (loadPromise) return loadPromise;

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
          console.log('[TradingView] Loaded from public folder');
          resolvePublic();
        };
        script.onerror = () => {
          console.warn('[TradingView] Failed to load from public folder, trying proxy...');
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
          console.log('[TradingView] Loaded from proxy');
          resolveProxy();
        };
        script.onerror = () => {
          console.warn('[TradingView] Failed to load from proxy, trying external CDN...');
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
          console.log('[TradingView] Loaded from external CDN');
          resolveCDN();
        };
        script.onerror = () => {
          console.error('[TradingView] All loading attempts failed');
          rejectCDN(new Error('All TradingView loading sources failed'));
        };
        document.head.appendChild(script);
      });
    };

    // Try sources in order: public folder -> proxy -> external CDN
    tryLoadFromPublic()
      .then(resolve)
      .catch(() =>
        tryLoadFromProxy()
          .then(resolve)
          .catch(() => tryLoadFromCDN().then(resolve).catch(reject))
      );
  });

  return loadPromise;
};

/**
 * TradingViewChart Component
 */
export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
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
          symbol,
          interval: 'D',
          container: elementIdRef.current, // Changed from container_id (deprecated)
          datafeed: candlesService,
          library_path: '/trading-view/',
          locale: 'en',
          autosize: true,
          toolbar_bg: '#ffffff',
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
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#10B981',
            'mainSeriesProperties.candleStyle.downColor': '#EF4444',
            'mainSeriesProperties.candleStyle.drawBorder': false,
            'mainSeriesProperties.candleStyle.wickUpColor': '#10B981',
            'mainSeriesProperties.candleStyle.wickDownColor': '#EF4444',
            'paneProperties.background': '#ffffff',
            // Grid color removed - path doesn't exist in this version
            volumePaneSize: 'medium',
          },
          studies_overrides: {
            'volume.volume.color.0': '#EF4444',
            'volume.volume.color.1': '#10B981',
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        chartRef.current.onChartReady(() => {
          console.log('[TradingView] Chart ready for:', symbol);
          if (isMounted) {
            setLoadingState('success');
          }
        });
      } catch (error) {
        console.error('[TradingView] Failed to initialize:', error);
        if (isMounted) {
          setLoadingState('error');
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load chart');
        }
      }
    };

    initChart();

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
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Chart Load Failed
          </Typography>
          <Typography variant="body2">{errorMessage || 'Unable to load trading chart'}</Typography>
        </Alert>
      )}

      <div
        id={elementIdRef.current}
        style={{
          width: '100%',
          height: '100%',
          display: loadingState === 'success' ? 'block' : 'none',
        }}
        ref={containerRef}
      />
    </ChartContainer>
  );
};
