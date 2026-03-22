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

/** Supported TradingView resolutions and exchange metadata */
const configurationData = {
  exchanges: [{ desc: 'DecentralChain DEX', name: 'DecentralChain', value: 'DecentralChain' }],
  supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'] as ResolutionString[],
  symbols_types: [{ name: 'crypto', value: 'crypto' }],
};

/** Map TradingView resolution string to matcher API interval name */
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
  return map[resolution] ?? '1h';
};

/** Map TradingView resolution string to milliseconds — used to size the polling window */
const resolutionToMs = (resolution: string): number => {
  const map: Record<string, number> = {
    '1': 60_000,
    '5': 300_000,
    '15': 900_000,
    '30': 1_800_000,
    '60': 3_600_000,
    '240': 14_400_000,
    D: 86_400_000,
    M: 2_592_000_000,
    W: 604_800_000,
  };
  return map[resolution] ?? 3_600_000;
};

/** Fetch candlestick bars from the DecentralChain matcher REST endpoint */
const fetchCandles = async (
  amountAsset: string,
  priceAsset: string,
  from: number,
  to: number,
  interval: string,
  matcherUrl: string,
): Promise<DecentralChainCandle[]> => {
  try {
    const url = `${matcherUrl}/matcher/orderbook/${amountAsset}/${priceAsset}/candlestick/${interval}`;
    const params = new URLSearchParams({
      timeEnd: to.toString(),
      timeStart: from.toString(),
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch candles');

    const data = await response.json();
    return (data.candles as DecentralChainCandle[] | undefined) ?? [];
  } catch (error) {
    logger.error('Error fetching candles:', error);
    return [];
  }
};

/**
 * Create a TradingView IBasicDataFeed instance for a DecentralChain trading pair.
 *
 * @param amountAsset     - Base asset ID (e.g. "DCC")
 * @param priceAsset      - Quote asset ID (e.g. BTC asset ID)
 * @param amountAssetName - Base asset display name
 * @param priceAssetName  - Quote asset display name
 * @param matcherUrl      - Matcher base URL from config
 */
export const createDatafeed = (
  amountAsset: string,
  priceAsset: string,
  amountAssetName: string,
  priceAssetName: string,
  matcherUrl: string = 'https://mainnet-matcher.decentralchain.io',
): IBasicDataFeed => {
  // Per-datafeed subscription registry: listenerGuid → polling timer handle
  const subscriptions = new Map<string, ReturnType<typeof setInterval>>();

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
          matcherUrl,
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

    /**
     * Subscribe to real-time bar updates via REST polling.
     *
     * The DCC matcher exposes no dedicated candlestick WebSocket stream, so this
     * implementation polls the candlestick REST endpoint every 15 seconds. On each
     * tick it requests the last 2 × resolution window and emits the most recent bar
     * to TradingView only when it represents a bar newer than the last emitted one.
     *
     * A first poll fires immediately (before the first interval elapses) so the chart
     * responds as soon as the datafeed connects. Polling is cancelled by `unsubscribeBars`.
     */
    subscribeBars: (
      _symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      onTick: SubscribeBarsCallback,
      listenerGuid: string,
      _onResetCacheNeededCallback: () => void,
    ) => {
      const POLL_INTERVAL_MS = 15_000;
      // Fetch last 2 × resolution to capture both in-progress and last completed bar
      const windowMs = resolutionToMs(resolution) * 2;
      let lastEmittedTime = 0;

      const poll = async () => {
        const now = Date.now();
        const candles = await fetchCandles(
          amountAsset,
          priceAsset,
          now - windowMs,
          now,
          resolutionToInterval(resolution),
          matcherUrl,
        );
        if (candles.length === 0) return;

        const latest = candles[candles.length - 1];
        if (!latest || latest.time <= lastEmittedTime) return;

        lastEmittedTime = latest.time;
        onTick({
          close: latest.close,
          high: latest.high,
          low: latest.low,
          open: latest.open,
          time: latest.time,
          volume: latest.volume,
        });
      };

      void poll(); // Immediate first tick — do not await (fire-and-forget)
      subscriptions.set(
        listenerGuid,
        setInterval(() => void poll(), POLL_INTERVAL_MS),
      );
      logger.debug('subscribeBars registered:', listenerGuid);
    },

    unsubscribeBars: (listenerGuid: string) => {
      const timer = subscriptions.get(listenerGuid);
      if (timer !== undefined) {
        clearInterval(timer);
        subscriptions.delete(listenerGuid);
      }
      logger.debug('unsubscribeBars:', listenerGuid);
    },
  };
};
