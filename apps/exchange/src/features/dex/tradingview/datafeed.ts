/**
 * TradingView Datafeed for DecentralChain
 * Provides candle data from DecentralChain matcher
 */
import {
  type Bar,
  type ErrorCallback,
  type HistoryCallback,
  type IBasicDataFeed,
  type LibrarySymbolInfo,
  type OnReadyCallback,
  type ResolutionString,
  type ResolveCallback,
  type SearchSymbolsCallback,
  type SubscribeBarsCallback,
} from 'charting_library';
import { logger } from '@/lib/logger';

interface DecentralChainCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Configuration for supported resolutions
 */
const configurationData = {
  exchanges: [{ desc: 'DecentralChain DEX', name: 'DecentralChain', value: 'DecentralChain' }],
  supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'] as ResolutionString[],
  symbols_types: [{ name: 'crypto', value: 'crypto' }],
};

/**
 * Convert resolution to API interval format
 */
const resolutionToInterval = (resolution: string): string => {
  const map: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '240': '4h',
    D: '1d',
    M: '1M',
    W: '1w',
  };
  return map[resolution] || '1h';
};

/**
 * Fetch candles from DecentralChain data service
 */
const fetchCandles = async (
  amountAsset: string,
  priceAsset: string,
  from: number,
  to: number,
  interval: string,
): Promise<DecentralChainCandle[]> => {
  try {
    // Get matcher address from config (you may need to adjust this)
    const matcher = 'https://matcher.decentral-chain.io';

    const url = `${matcher}/matcher/orderbook/${amountAsset}/${priceAsset}/candlestick/${interval}`;
    const params = new URLSearchParams({
      timeEnd: to.toString(),
      timeStart: from.toString(),
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch candles');

    const data = await response.json();
    return data.candles || [];
  } catch (error) {
    logger.error('Error fetching candles:', error);
    return [];
  }
};

/**
 * Create TradingView datafeed
 */
export const createDatafeed = (
  amountAsset: string,
  priceAsset: string,
  amountAssetName: string,
  priceAssetName: string,
): IBasicDataFeed => {
  return {
    getBars: async (
      _symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: {
        from: number;
        to: number;
        firstDataRequest: boolean;
        countBack?: number;
      },
      onResult: HistoryCallback,
      onError: ErrorCallback,
    ) => {
      try {
        const { from, to } = periodParams;
        const interval = resolutionToInterval(resolution);

        const candles = await fetchCandles(
          amountAsset,
          priceAsset,
          from * 1000, // Convert to milliseconds
          to * 1000,
          interval,
        );

        if (candles.length === 0) {
          onResult([], { noData: true });
          return;
        }

        const bars: Bar[] = candles.map((candle) => ({
          close: candle.close,
          high: candle.high,
          low: candle.low,
          open: candle.open,
          time: candle.time,
          volume: candle.volume,
        }));

        // Sort by time ascending
        bars.sort((a, b) => a.time - b.time);

        onResult(bars, { noData: false });
      } catch (error) {
        logger.error('Error in getBars:', error);
        onError(error instanceof Error ? error.message : String(error));
      }
    },
    onReady: (callback: OnReadyCallback) => {
      setTimeout(() => callback(configurationData), 0);
    },

    resolveSymbol: (symbolName: string, onResolve: ResolveCallback, _onError: ErrorCallback) => {
      const symbolInfo: LibrarySymbolInfo = {
        data_status: 'streaming',
        description: `${amountAssetName}/${priceAssetName}`,
        exchange: 'DecentralChain',
        format: 'price',
        has_daily: true,
        has_intraday: true,
        has_weekly_and_monthly: true,
        minmov: 1,
        name: symbolName,
        pricescale: 100000000,
        session: '24x7',
        supported_resolutions: configurationData.supported_resolutions,
        ticker: symbolName,
        timezone: 'Etc/UTC',
        type: 'crypto',
        volume_precision: 8,
      };

      setTimeout(() => onResolve(symbolInfo), 0);
    },

    searchSymbols: (
      _userInput: string,
      _exchange: string,
      _symbolType: string,
      onResult: SearchSymbolsCallback,
    ) => {
      onResult([
        {
          description: `${amountAssetName}/${priceAssetName}`,
          exchange: 'DecentralChain',
          full_name: `DecentralChain:${amountAssetName}/${priceAssetName}`,
          symbol: `${amountAssetName}/${priceAssetName}`,
          ticker: `${amountAssetName}/${priceAssetName}`,
          type: 'crypto',
        },
      ]);
    },

    subscribeBars: (
      _symbolInfo: LibrarySymbolInfo,
      _resolution: ResolutionString,
      _onTick: SubscribeBarsCallback,
      listenerGuid: string,
      _onResetCacheNeededCallback: () => void,
    ) => {
      // TODO: Implement real-time updates via WebSocket
      logger.debug('subscribeBars:', listenerGuid);
    },

    unsubscribeBars: (listenerGuid: string) => {
      logger.debug('unsubscribeBars:', listenerGuid);
    },
  };
};
