/**
 * Market Data WebSocket Hook
 * Real-time market price and volume updates for trading pairs
 */
import { useCallback, useEffect, useState } from 'react';
import { config } from '@/config';
import { createWebSocketUrl, useWebSocketChannel } from '@/services/websocket';
import { useDexStore } from '@/stores/dexStore';

/**
 * Market Update Message
 * Real-time price and volume data for a trading pair
 */
export interface MarketUpdate {
  pair: {
    amountAsset: string;
    priceAsset: string;
  };
  currentPrice: number;
  lastPrice: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  timestamp: number;
}

/**
 * Ticker Update Message
 * Simplified market ticker for overview displays
 */
export interface TickerUpdate {
  pair: string; // "ASSET1/ASSET2" format
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

/**
 * All Markets Update Message
 * Batch update for all available trading pairs
 */
export interface AllMarketsUpdate {
  markets: TickerUpdate[];
  timestamp: number;
}

/**
 * Hook: useMarketData
 * Subscribe to real-time market data for selected trading pair
 * Updates DEX store with current market statistics
 *
 * @example
 * ```tsx
 * const { marketData, isLive, lastUpdate } = useMarketData();
 *
 * if (isLive) {
 *   logger.debug('Current price:', marketData?.currentPrice);
 * }
 * ```
 */
export const useMarketData = () => {
  const { selectedPair, updateMarketData } = useDexStore();
  const [marketData, setMarketData] = useState<MarketUpdate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);

  // Build channel name for current pair
  const channel = selectedPair
    ? `market:${selectedPair.amountAsset}/${selectedPair.priceAsset}`
    : '';

  // Handle market data updates
  const handleMarketUpdate = useCallback(
    (data: MarketUpdate) => {
      // Update local state
      setMarketData(data);
      setLastUpdate(Date.now());
      setIsLive(true);

      // Update Zustand store for global access
      updateMarketData({
        currentPrice: data.currentPrice,
        high24h: data.high24h,
        lastPrice: data.lastPrice,
        low24h: data.low24h,
        priceChange24h: data.priceChange24h,
        priceChangePercent24h: data.priceChangePercent24h,
        volume24h: data.volume24h,
      });
    },
    [updateMarketData],
  );

  // Subscribe to market data channel
  useWebSocketChannel<MarketUpdate>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleMarketUpdate,
    !!selectedPair, // Only subscribe when pair is selected
  );

  // Reset state when pair changes
  useEffect(() => {
    setMarketData(null);
    setIsLive(false);
  }, []);

  return {
    isLive,
    lastUpdate,
    marketData,
    selectedPair,
  };
};

/**
 * Hook: useAllMarkets
 * Subscribe to all trading pairs market data for market overview
 * Useful for market summary pages and top movers lists
 *
 * @example
 * ```tsx
 * const { markets, topGainers, topLosers } = useAllMarkets();
 *
 * topGainers.forEach(market => {
 *   logger.debug(`${market.pair}: +${market.change24h}%`);
 * });
 * ```
 */
export const useAllMarkets = () => {
  const [markets, setMarkets] = useState<TickerUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);
  const channel = 'markets:all';

  // Handle all markets update
  const handleAllMarketsUpdate = useCallback((data: AllMarketsUpdate) => {
    setMarkets(data.markets);
    setLastUpdate(data.timestamp);
  }, []);

  // Subscribe to all markets channel
  useWebSocketChannel<AllMarketsUpdate>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleAllMarketsUpdate,
    true, // Always enabled
  );

  // Calculate top gainers (sorted by price change descending)
  const topGainers = markets
    .filter((m) => m.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 10);

  // Calculate top losers (sorted by price change ascending)
  const topLosers = markets
    .filter((m) => m.change24h < 0)
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, 10);

  // Calculate highest volume pairs
  const topVolume = markets.sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);

  return {
    lastUpdate,
    markets,
    topGainers,
    topLosers,
    topVolume,
  };
};

/**
 * Hook: usePairTicker
 * Subscribe to specific trading pair ticker updates
 * Lightweight alternative to useMarketData for simple price displays
 *
 * @param amountAsset - Amount asset ID
 * @param priceAsset - Price asset ID
 *
 * @example
 * ```tsx
 * const { ticker, isConnected } = usePairTicker('DCC', 'USDT');
 *
 * return (
 *   <div>
 *     Price: ${ticker?.price}
 *     24h Change: {ticker?.change24h}%
 *   </div>
 * );
 * ```
 */
export const usePairTicker = (amountAsset?: string, priceAsset?: string) => {
  const [ticker, setTicker] = useState<TickerUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);

  // Build channel name
  const channel = amountAsset && priceAsset ? `ticker:${amountAsset}/${priceAsset}` : '';

  // Handle ticker update
  const handleTickerUpdate = useCallback((data: TickerUpdate) => {
    setTicker(data);
    setIsConnected(true);
  }, []);

  // Subscribe to ticker channel
  useWebSocketChannel<TickerUpdate>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleTickerUpdate,
    !!(amountAsset && priceAsset),
  );

  // Reset state when pair changes
  useEffect(() => {
    setTicker(null);
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    ticker,
  };
};

/**
 * Utility: formatPriceChange
 * Format price change with sign and color indication
 */
export const formatPriceChange = (change: number): { text: string; isPositive: boolean } => {
  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';
  const text = `${sign}${change.toFixed(2)}%`;

  return { isPositive, text };
};

/**
 * Utility: getPriceChangeColor
 * Get theme color for price change display
 */
export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'success'; // Green
  if (change < 0) return 'danger'; // Red
  return 'neutral'; // Gray
};

/**
 * Utility: formatVolume
 * Format volume with K/M/B suffixes
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
};

/**
 * Utility: calculatePriceChange
 * Calculate price change percentage
 */
export const calculatePriceChange = (currentPrice: number, lastPrice: number): number => {
  if (lastPrice === 0) return 0;
  return ((currentPrice - lastPrice) / lastPrice) * 100;
};

/**
 * Utility: isMarketDataStale
 * Check if market data is outdated (older than 60 seconds)
 */
export const isMarketDataStale = (lastUpdate: number): boolean => {
  const now = Date.now();
  const threshold = 60_000; // 60 seconds
  return now - lastUpdate > threshold;
};
