/**
 * TradingView Datafeed for DecentralChain
 * Provides candle data from DecentralChain matcher
 */
import {
  IBasicDataFeed,
  LibrarySymbolInfo,
  ResolutionString,
  Bar,
  HistoryCallback,
  SubscribeBarsCallback,
  ErrorCallback,
  OnReadyCallback,
  ResolveCallback,
  SearchSymbolsCallback,
} from 'charting_library';

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
  supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'] as ResolutionString[],
  exchanges: [{ value: 'DecentralChain', name: 'DecentralChain', desc: 'DecentralChain DEX' }],
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
    W: '1w',
    M: '1M',
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
  interval: string
): Promise<DecentralChainCandle[]> => {
  try {
    // Get matcher address from config (you may need to adjust this)
    const matcher = 'https://matcher.decentral-chain.io';

    const url = `${matcher}/matcher/orderbook/${amountAsset}/${priceAsset}/candlestick/${interval}`;
    const params = new URLSearchParams({
      timeStart: from.toString(),
      timeEnd: to.toString(),
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch candles');

    const data = await response.json();
    return data.candles || [];
  } catch (error) {
    console.error('Error fetching candles:', error);
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
  priceAssetName: string
): IBasicDataFeed => {

  return {
    onReady: (callback: OnReadyCallback) => {
      setTimeout(() => callback(configurationData), 0);
    },

    searchSymbols: (
      userInput: string,
      exchange: string,
      symbolType: string,
      onResult: SearchSymbolsCallback
    ) => {
      onResult([
        {
          symbol: `${amountAssetName}/${priceAssetName}`,
          full_name: `DecentralChain:${amountAssetName}/${priceAssetName}`,
          description: `${amountAssetName}/${priceAssetName}`,
          exchange: 'DecentralChain',
          ticker: `${amountAssetName}/${priceAssetName}`,
          type: 'crypto',
        },
      ]);
    },

    resolveSymbol: (symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback) => {
      const symbolInfo: LibrarySymbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: `${amountAssetName}/${priceAssetName}`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'DecentralChain',
        minmov: 1,
        pricescale: 100000000,
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 8,
        data_status: 'streaming',
        format: 'price',
      };

      setTimeout(() => onResolve(symbolInfo), 0);
    },

    getBars: async (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: {
        from: number;
        to: number;
        firstDataRequest: boolean;
        countBack?: number;
      },
      onResult: HistoryCallback,
      onError: ErrorCallback
    ) => {
      try {
        const { from, to } = periodParams;
        const interval = resolutionToInterval(resolution);

        const candles = await fetchCandles(
          amountAsset,
          priceAsset,
          from * 1000, // Convert to milliseconds
          to * 1000,
          interval
        );

        if (candles.length === 0) {
          onResult([], { noData: true });
          return;
        }

        const bars: Bar[] = candles.map((candle) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        // Sort by time ascending
        bars.sort((a, b) => a.time - b.time);

        onResult(bars, { noData: false });
      } catch (error) {
        console.error('Error in getBars:', error);
        onError(error instanceof Error ? error.message : String(error));
      }
    },

    subscribeBars: (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      onTick: SubscribeBarsCallback,
      listenerGuid: string,
      onResetCacheNeededCallback: () => void
    ) => {
      // TODO: Implement real-time updates via WebSocket
      console.log('subscribeBars:', listenerGuid);
    },

    unsubscribeBars: (listenerGuid: string) => {
      console.log('unsubscribeBars:', listenerGuid);
    },
  };
};
