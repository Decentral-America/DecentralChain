/**
 * CandlesService - TradingView Datafeed Implementation
 * Based on Angular version's CandlesService.js
 */

import { base58Decode, address as buildAddress } from '@decentralchain/ts-lib-crypto';
import { config } from 'data-service';
import { NetworkConfig } from '@/config/networkConfig';
import { logger } from '@/lib/logger';

const POLL_DELAY = 800;
const MAX_RESOLUTION = 1440;

interface Candle {
  time: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  txsCount: number;
}

interface SymbolInfo {
  _dccData: {
    amountAsset: { id: string };
    priceAsset: { id: string };
  };
  [key: string]: unknown;
}

interface IntervalConfig {
  interval: number;
  intervalName: string;
  converter: (candles: Candle[]) => Candle[];
}

// Helper functions for candle aggregation (matches Angular utils.js)
const maxOrNull =
  (name: keyof Candle) =>
  (c1: Candle, c2: Candle): number | null => {
    const v1 = c1[name] as number | null;
    const v2 = c2[name] as number | null;
    if (v1 === null) return v2;
    return v2 === null ? v1 : Math.max(v1, v2);
  };

const minOrNull =
  (name: keyof Candle) =>
  (c1: Candle, c2: Candle): number | null => {
    const v1 = c1[name] as number | null;
    const v2 = c2[name] as number | null;
    if (v1 === null) return v2;
    return v2 === null ? v1 : Math.min(v1, v2);
  };

const nullOrSum =
  (name: keyof Candle) =>
  (c1: Candle, c2: Candle): number | null => {
    const v1 = c1[name] as number | null;
    const v2 = c2[name] as number | null;
    if (v1 === null) return v2;
    return v2 === null ? v1 : v1 + v2;
  };

const valOrNullClose = (v1: number | null, v2: number | null): number | null => {
  return v2 === null ? v1 : v2;
};

const valOrNullOpen = (v1: number | null, v2: number | null): number | null => {
  return v1 === null ? v2 : v1;
};

const nullOrCb =
  (name: keyof Candle, cb: (v1: number | null, v2: number | null) => number | null) =>
  (c1: Candle, c2: Candle): number | null => {
    return cb(c1[name] as number | null, c2[name] as number | null);
  };

// Join two candles into one (matches Angular joinCandles)
const joinCandles = (candles: Candle[]): Candle => {
  const [first, second] = candles;
  if (!first) {
    return { close: null, high: null, low: null, open: null, time: 0, txsCount: 0, volume: null };
  }
  const c1 = first;
  const c2 = second ?? first;
  return {
    close: nullOrCb('close', valOrNullClose)(c1, c2),
    high: maxOrNull('high')(c1, c2),
    low: minOrNull('low')(c1, c2),
    open: nullOrCb('open', valOrNullOpen)(c1, c2),
    time: c1.time,
    txsCount: c1.txsCount + (c2.txsCount || 0),
    volume: nullOrSum('volume')(c1, c2),
  };
};

// Split array into chunks (like Ramda's splitEvery)
const splitEvery = <T>(n: number, arr: T[]): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
};

// Pipe functions together (for complex converters) - kept for future use
// const pipe =
//   <T>(...fns: Array<(arg: T) => T>) =>
//   (x: T): T =>
//     fns.reduce((v, f) => f(v), x);

// Map function (like Ramda's map) - kept for future use
// const map =
//   <T, R>(fn: (item: T) => R) =>
//   (arr: T[]): R[] =>
//     arr.map(fn);

// Interval presets (matches Angular INTERVAL_PRESETS)
const INTERVAL_PRESETS: Record<string, number> = {
  '1d': 1000 * 60 * 60 * 24,
  '1h': 1000 * 60 * 60,
  '1m': 1000 * 60,
  '3h': 1000 * 60 * 60 * 3,
  '5m': 1000 * 60 * 5,
  '6h': 1000 * 60 * 60 * 6,
  '12h': 1000 * 60 * 60 * 12,
  '15m': 1000 * 60 * 15,
  '30m': 1000 * 60 * 30,
};

// Interval map with converters (matches Angular INTERVAL_MAP)
const INTERVAL_MAP: Record<number, IntervalConfig> = {
  1: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['1m'] ?? 0,
    intervalName: '1m',
  },
  5: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['5m'] ?? 0,
    intervalName: '5m',
  },
  15: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['15m'] ?? 0,
    intervalName: '15m',
  },
  30: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['30m'] ?? 0,
    intervalName: '30m',
  },
  60: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['1h'] ?? 0,
    intervalName: '1h',
  },
  120: {
    converter: (candles) => splitEvery(2, candles).map(joinCandles),
    interval: INTERVAL_PRESETS['1h'] ?? 0,
    intervalName: '1h',
  },
  180: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['3h'] ?? 0,
    intervalName: '3h',
  },
  240: {
    converter: (candles) => {
      // Split into pairs, join each pair, then split again and join again
      const step1 = splitEvery(2, candles).map(joinCandles);
      const step2 = splitEvery(2, step1).map(joinCandles);
      return step2;
    },
    interval: INTERVAL_PRESETS['1h'] ?? 0,
    intervalName: '1h',
  },
  360: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['6h'] ?? 0,
    intervalName: '6h',
  },
  720: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['12h'] ?? 0,
    intervalName: '12h',
  },
  1440: {
    converter: (el) => el,
    interval: INTERVAL_PRESETS['1d'] ?? 0,
    intervalName: '1d',
  },
};

class CandlesService {
  private _lastTime: number = 0;
  private _subscriber: string | null = null;
  public onLoadError: () => void = () => {};
  private _timerId: number | null = null;

  /**
   * Get valid candle options with batching (matches Angular getValidCandleOptions)
   * Splits large time ranges into MAX_RESOLUTION chunks
   */
  private static _getValidCandleOptions(
    from: number,
    to: number,
    intervalMinutes: number,
  ): {
    options: Array<{ timeStart: number; timeEnd: number; interval: string }>;
    config: IntervalConfig;
  } {
    const minute = 1000 * 60;

    // Round to nearest minute
    from = Math.floor(from / minute) * minute;
    to = Math.ceil(to / minute) * minute;

    const config = INTERVAL_MAP[intervalMinutes];

    if (!config) {
      // Default to 1 day if interval not found
      const defaultConfig = INTERVAL_MAP[1440];
      if (!defaultConfig) {
        throw new Error('Default interval config (1440) not found');
      }
      return {
        config: defaultConfig,
        options: [{ interval: defaultConfig.intervalName, timeEnd: to, timeStart: from }],
      };
    }

    // Adjust time range if too small
    if (to - from < config.interval) {
      from = to - config.interval;
    }

    // Split into batches (MAX_RESOLUTION chunks)
    const intervals: Array<{ timeStart: number; timeEnd: number; interval: string }> = [];
    let currentStart = from;

    while (currentStart <= to) {
      const currentEnd = Math.min(to, currentStart + config.interval * MAX_RESOLUTION);
      intervals.push({
        interval: config.intervalName,
        timeEnd: currentEnd,
        timeStart: currentStart,
      });
      currentStart = currentEnd + config.interval;
    }

    return {
      config,
      options: intervals,
    };
  }

  /**
   * Convert TradingView resolution to interval minutes (for INTERVAL_MAP lookup)
   */
  private static _resolutionToMinutes(resolution: string): number {
    const resolutionMap: Record<string, number> = {
      '1': 1,
      '1D': 1440,
      '1W': 10080,
      '5': 5,
      '15': 15,
      '30': 30,
      '60': 60,
      '120': 120,
      '180': 180,
      '240': 240,
      '360': 360,
      '720': 720,
      D: 1440,
      W: 10080,
    };
    return resolutionMap[resolution] || 1440; // Default to 1 day
  }

  /**
   * Fetch candles from data service (matches Angular _getCandles)
   */
  private static async _getCandles(
    symbolInfo: SymbolInfo,
    from: number,
    to: number,
    resolution: string,
  ): Promise<Candle[]> {
    // Match Angular behavior: if from is not set, use to (for initial load)
    from = from || to;

    const amountId = symbolInfo._dccData.amountAsset.id;
    const priceId = symbolInfo._dccData.priceAsset.id;

    // Convert TradingView resolution to interval minutes
    const intervalMinutes = CandlesService._resolutionToMinutes(resolution);

    // Get batched options and interval config with converter
    const { options, config: candleConfig } = CandlesService._getValidCandleOptions(
      from,
      to,
      intervalMinutes,
    );

    logger.debug(
      `[Candles] Fetching ${options.length} batches for interval ${intervalMinutes}m (${candleConfig.intervalName})`,
    );

    try {
      // Get matcher address (like Angular does)
      const fullConfig = NetworkConfig.getFullConfig();
      const matcherUrl = fullConfig.matcher || 'https://mainnet-matcher.decentralchain.io/matcher';

      // Fetch matcher public key from the matcher endpoint
      const matcherPublicKeyResponse = await fetch(`${matcherUrl}/`);
      const matcherPublicKey = await matcherPublicKeyResponse.json();

      // Convert matcher public key to address
      const matcherPublicKeyBytes = base58Decode(matcherPublicKey);
      const networkByte = fullConfig.code.charCodeAt(0);
      const matcherAddress = buildAddress({ publicKey: matcherPublicKeyBytes }, networkByte);

      // Fetch candles in batches (matches Angular line 52-56)
      const promises = options.map((option) =>
        config.getDataService().getCandles(amountId, priceId, {
          matcher: matcherAddress,
          ...option,
        }),
      );

      // Wait for all batches and flatten results
      const responses = await Promise.all(promises);
      const rawCandles = responses.flatMap(
        (response) => (response as { data?: unknown[] })?.data || [],
      );

      logger.debug('[Candles] Raw candles count:', rawCandles.length);

      // Helper to convert BigNumber/Money to number (matches Angular's convertBigNumber line 60)
      const convertBigNumber = (num: unknown): number | null => {
        if (!num) return null;

        // CRITICAL: Check isNaN() FIRST (same as Angular)
        // Money/BigNumber objects have isNaN() that checks internal validity
        // Angular: const convertBigNumber = num => (num.isNaN() ? null : Number(num.toFixed()));
        if (
          typeof num === 'object' &&
          num !== null &&
          'isNaN' in num &&
          typeof (num as { isNaN?: unknown }).isNaN === 'function'
        ) {
          const obj = num as { isNaN(): boolean; toFixed(): string };
          if (obj.isNaN()) {
            return null;
          }
          return Number(obj.toFixed());
        }

        // If it's already a number
        if (typeof num === 'number') {
          return Number.isNaN(num) ? null : num;
        }

        // Try to convert to number as fallback
        const numValue = Number(num);
        return Number.isNaN(numValue) ? null : numValue;
      };

      // Process candles (matches Angular line 62-72)
      interface DsCandle {
        close: unknown;
        high: unknown;
        low: unknown;
        open: unknown;
        time: string | number;
        txsCount?: number;
        volume: unknown;
      }
      let processedCandles = (rawCandles as DsCandle[]).map((candle) => ({
        close: convertBigNumber(candle.close),
        high: convertBigNumber(candle.high),
        low: convertBigNumber(candle.low),
        open: convertBigNumber(candle.open),
        time: new Date(candle.time).getTime(),
        txsCount: candle.txsCount || 0,
        volume: convertBigNumber(candle.volume),
      }));

      // Apply interval-specific converter (matches Angular line 82)
      // This is the KEY STEP that was missing - aggregates/resamples candles based on interval
      if (processedCandles.length > 1) {
        processedCandles = candleConfig.converter(processedCandles);
      }

      // Filter and sort (matches Angular line 85 - only checks open != null)
      const finalCandles = processedCandles
        .filter((candle) => candle.open !== null)
        .sort((a, b) => a.time - b.time) as Candle[];

      logger.debug(
        '[Candles] Processed candles count after converter and filter:',
        finalCandles.length,
      );

      return finalCandles;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('[Candles] Error fetching candles:', msg, error);
      // Wait and return empty array on error (matches Angular)
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return [];
    }
  }

  private static _getAndHandleCandles(
    symbolInfo: SymbolInfo,
    from: number,
    to: number,
    resolution: string,
    handleCandles: (candles: Candle[]) => void,
    handleError: (error: unknown) => void = () => {},
  ) {
    CandlesService._getCandles(symbolInfo, from, to, resolution)
      .then(handleCandles)
      .catch(handleError);
  }

  static convertToMilliseconds(seconds: number): number {
    return seconds ? seconds * 1000 : Date.now();
  }

  /**
   * TradingView Datafeed Methods
   */

  onReady(callback: (config: Record<string, unknown>) => void) {
    setTimeout(
      () =>
        callback({
          supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
          supports_marks: false,
          supports_time: true,
          supports_timescale_marks: false,
        }),
      0,
    );
  }

  resolveSymbol(
    symbolName: string,
    resolve: (symbolInfo: SymbolInfo) => void,
    _reject: () => void,
  ) {
    // For DecentralChain, we need to create symbol info from pair
    // This will be called with symbol like "ASSET1/ASSET2"
    const [amountAsset, priceAsset] = symbolName.split('/');

    const symbolInfo = {
      _dccData: {
        amountAsset: { id: amountAsset },
        priceAsset: { id: priceAsset },
      },
      data_status: 'streaming',
      description: `${amountAsset}/${priceAsset}`,
      exchange: 'DecentralChain',
      has_daily: true,
      has_intraday: true,
      has_weekly_and_monthly: true,
      minmov: 1,
      name: symbolName,
      pricescale: 100000000,
      session: '24x7',
      supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
      ticker: symbolName,
      timezone: 'Etc/UTC',
      type: 'crypto',
      volume_precision: 8,
    };

    setTimeout(() => resolve(symbolInfo as SymbolInfo), 0);
  }

  getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: { from: number; to: number; firstDataRequest: boolean },
    onHistoryCallback: (bars: Candle[], meta: { noData: boolean }) => void,
    onErrorCallback: (error: unknown) => void,
  ) {
    let { from, to } = periodParams;
    from = CandlesService.convertToMilliseconds(from);
    to = CandlesService.convertToMilliseconds(to);

    const handleCandles = (candles: Candle[]) => {
      if (candles.length) {
        this._updateLastTime(candles);
        onHistoryCallback(candles, { noData: false });
      } else {
        onHistoryCallback([], { noData: true });
      }
    };

    CandlesService._getAndHandleCandles(
      symbolInfo,
      from,
      to,
      resolution,
      handleCandles,
      onErrorCallback,
    );
  }

  subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Candle) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void,
  ) {
    this._subscriber = subscriberUID;

    const to = Date.now();
    const from = this._lastTime;

    const handleCandles = (candles: Candle[]) => {
      if (this._subscriber !== subscriberUID) {
        return;
      }

      // Schedule next poll
      this._timerId = window.setTimeout(() => {
        this.subscribeBars(
          symbolInfo,
          resolution,
          onRealtimeCallback,
          subscriberUID,
          onResetCacheNeededCallback,
        );
      }, POLL_DELAY);

      if (candles.length) {
        // Filter out candles that are older than or equal to _lastTime
        // to prevent sending duplicate/overlapping data to TradingView
        const newCandles = candles.filter((candle) => candle.time > this._lastTime);

        if (newCandles.length > 0) {
          logger.debug(
            `[Candles] Sending ${newCandles.length} new candles (filtered ${candles.length - newCandles.length} duplicates)`,
          );
          this._updateLastTime(newCandles);
          newCandles.forEach(onRealtimeCallback);
        }
      }
    };

    CandlesService._getAndHandleCandles(symbolInfo, from, to, resolution, handleCandles);
  }

  unsubscribeBars() {
    this._subscriber = null;
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }

  private _updateLastTime(candles: Candle[]) {
    const lastTime = candles[candles.length - 1]?.time;
    if (lastTime === undefined || (this._lastTime && this._lastTime >= lastTime)) {
      return false;
    }
    this._lastTime = lastTime;
  }
}

export const candlesService = new CandlesService();
