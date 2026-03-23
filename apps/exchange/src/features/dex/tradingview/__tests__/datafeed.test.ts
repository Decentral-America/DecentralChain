/**
 * TradingView Datafeed — Unit Tests
 *
 * Verifies that `createDatafeed` returns a compliant IBasicDataFeed implementation:
 *   - `onReady` delivers the configuration object to TradingView
 *   - `resolveSymbol` returns a correctly structured LibrarySymbolInfo
 *   - `searchSymbols` returns the active trading pair
 *   - `getBars` maps matcher candle data to TradingView Bar format
 *   - `getBars` signals noData=true when no candles exist
 *   - `subscribeBars` registers a 15-second polling interval and fires an
 *     immediate first tick with the latest bar
 *   - `subscribeBars` deduplicates — does not emit bars with the same timestamp
 *     twice on the same subscription
 *   - `unsubscribeBars` clears the interval and removes the subscription
 *
 * All network calls are intercepted via `vi.stubGlobal` on `fetch`; no real
 * HTTP calls are made.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatafeed } from '@/features/dex/tradingview/datafeed';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

const MATCHER_URL = 'https://mainnet-matcher.decentralchain.io';
const AMOUNT_ASSET = 'DCC';
const PRICE_ASSET = '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK';
const AMOUNT_NAME = 'DCC';
const PRICE_NAME = 'BTC';

const makeCandle = (time = 1_700_000_000_000) => ({
  close: 1.05,
  high: 1.1,
  low: 0.95,
  open: 1.0,
  time,
  volume: 500,
});

const mockFetchWithCandles = (candles: ReturnType<typeof makeCandle>[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => ({ candles }),
      ok: true,
    }),
  );
};

const mockFetchEmpty = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => ({ candles: [] }),
      ok: true,
    }),
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe('createDatafeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── onReady ──────────────────────────────────────────────────────────────

  describe('onReady', () => {
    it('calls the callback with supported resolutions including 1m, 1h, and Daily', async () => {
      mockFetchEmpty();
      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onReady = vi.fn();

      datafeed.onReady(onReady);
      // onReady schedules its callback via setTimeout(fn, 0) — wait for it to fire
      await vi.waitFor(() => expect(onReady).toHaveBeenCalledOnce());

      const [config] = onReady.mock.calls[0]! as [{ supported_resolutions: string[] }];
      expect(config.supported_resolutions).toEqual(
        expect.arrayContaining(['1', '5', '15', '30', '60', '240', 'D', 'W', 'M']),
      );
    });

    it('includes the DecentralChain exchange in the exchanges list', async () => {
      mockFetchEmpty();
      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onReady = vi.fn();

      datafeed.onReady(onReady);
      await vi.waitFor(() => expect(onReady).toHaveBeenCalledOnce());

      const [config] = onReady.mock.calls[0]! as [{ exchanges: Array<{ value: string }> }];
      expect(config.exchanges[0]?.value).toBe('DecentralChain');
    });
  });

  // ── resolveSymbol ─────────────────────────────────────────────────────────

  describe('resolveSymbol', () => {
    it('resolves with the correct pair description and session', async () => {
      mockFetchEmpty();
      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResolve = vi.fn();

      datafeed.resolveSymbol('DCC/BTC', onResolve, vi.fn());
      await vi.waitFor(() => expect(onResolve).toHaveBeenCalledOnce());
      const [symbolInfo] = onResolve.mock.calls[0]! as [
        { description: string; session: string; timezone: string },
      ];
      expect(symbolInfo.description).toBe('DCC/BTC');
      expect(symbolInfo.session).toBe('24x7');
      expect(symbolInfo.timezone).toBe('Etc/UTC');
    });
  });

  // ── searchSymbols ─────────────────────────────────────────────────────────

  describe('searchSymbols', () => {
    it('returns the active trading pair as the single result', () => {
      mockFetchEmpty();
      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResult = vi.fn();

      datafeed.searchSymbols('anything', 'DecentralChain', 'crypto', onResult);

      expect(onResult).toHaveBeenCalledOnce();
      const [results] = onResult.mock.calls[0]! as [Array<{ symbol: string; exchange: string }>];
      expect(results).toHaveLength(1);
      expect(results[0]?.symbol).toBe('DCC/BTC');
      expect(results[0]?.exchange).toBe('DecentralChain');
    });
  });

  // ── getBars ───────────────────────────────────────────────────────────────

  describe('getBars', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('maps matcher candle data to TradingView Bar format', async () => {
      const candle = makeCandle(1_700_000_000_000);
      mockFetchWithCandles([candle]);

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResult = vi.fn();
      const onError = vi.fn();

      await datafeed.getBars(
        // _symbolInfo is unused in the implementation; pass a minimal shape
        {} as Parameters<typeof datafeed.getBars>[0],
        '60' as Parameters<typeof datafeed.getBars>[1],
        { firstDataRequest: true, from: 1_700_000, to: 1_701_000 },
        onResult,
        onError,
      );

      expect(onResult).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();

      const [bars, meta] = onResult.mock.calls[0] as [
        Array<{ time: number; open: number; close: number }>,
        { noData: boolean },
      ];
      expect(meta.noData).toBe(false);
      expect(bars).toHaveLength(1);
      expect(bars[0]).toMatchObject({
        close: candle.close,
        high: candle.high,
        low: candle.low,
        open: candle.open,
        time: candle.time,
      });
    });

    it('signals noData=true when the matcher returns an empty candles array', async () => {
      mockFetchEmpty();

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResult = vi.fn();

      await datafeed.getBars(
        {} as Parameters<typeof datafeed.getBars>[0],
        '60' as Parameters<typeof datafeed.getBars>[1],
        { firstDataRequest: true, from: 1_700_000, to: 1_701_000 },
        onResult,
        vi.fn(),
      );

      const [bars, meta] = onResult.mock.calls[0] as [unknown[], { noData: boolean }];
      expect(meta.noData).toBe(true);
      expect(bars).toHaveLength(0);
    });

    it('sorts bars by time ascending when the matcher returns them out of order', async () => {
      const early = makeCandle(1_000_000);
      const late = makeCandle(2_000_000);
      mockFetchWithCandles([late, early]); // intentionally reversed

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResult = vi.fn();

      await datafeed.getBars(
        {} as Parameters<typeof datafeed.getBars>[0],
        '60' as Parameters<typeof datafeed.getBars>[1],
        { firstDataRequest: true, from: 900, to: 2_100 },
        onResult,
        vi.fn(),
      );

      const [bars] = onResult.mock.calls[0] as [Array<{ time: number }>];
      expect(bars[0]?.time).toBe(1_000_000);
      expect(bars[1]?.time).toBe(2_000_000);
    });

    it('signals noData=true when fetch fails (network error is swallowed by fetchCandles)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onResult = vi.fn();

      await datafeed.getBars(
        {} as Parameters<typeof datafeed.getBars>[0],
        '60' as Parameters<typeof datafeed.getBars>[1],
        { firstDataRequest: true, from: 1_700_000, to: 1_701_000 },
        onResult,
        vi.fn(),
      );

      // fetchCandles catches errors and returns [] → getBars signals noData
      const [, meta] = onResult.mock.calls[0] as [unknown[], { noData: boolean }];
      expect(meta.noData).toBe(true);
    });
  });

  // ── subscribeBars / unsubscribeBars ───────────────────────────────────────

  describe('subscribeBars / unsubscribeBars', () => {
    it('registers a 15-second polling interval on subscribe', () => {
      mockFetchEmpty();
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        vi.fn(),
        'guid-interval',
        vi.fn(),
      );

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15_000);

      datafeed.unsubscribeBars('guid-interval');
    });

    it('fires an immediate first tick with the latest candle on subscribe', async () => {
      const candle = makeCandle(1_800_000_000_000);
      mockFetchWithCandles([candle]);

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onTick = vi.fn();

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        onTick,
        'guid-first-tick',
        vi.fn(),
      );

      // Wait for the asynchronous first poll to resolve
      await vi.waitFor(() => expect(onTick).toHaveBeenCalledOnce());

      const [bar] = onTick.mock.calls[0]! as [{ time: number; close: number }];
      expect(bar.time).toBe(candle.time);
      expect(bar.close).toBe(candle.close);

      datafeed.unsubscribeBars('guid-first-tick');
    });

    it('does not re-emit a bar with the same timestamp on subsequent polls', async () => {
      const candle = makeCandle(1_900_000_000_000);
      // Every fetch returns the same candle
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          json: async () => ({ candles: [candle] }),
          ok: true,
        }),
      );

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onTick = vi.fn();

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        onTick,
        'guid-dedup',
        vi.fn(),
      );

      // Wait for the first emission
      await vi.waitFor(() => expect(onTick).toHaveBeenCalledOnce());

      // Manually invoke the poll callback a second time by advancing the interval
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(15_000);
      vi.useRealTimers();

      // onTick should still have been called only once (duplicate suppressed)
      expect(onTick).toHaveBeenCalledOnce();

      datafeed.unsubscribeBars('guid-dedup');
    });

    it('clears the interval when unsubscribeBars is called', () => {
      mockFetchEmpty();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        vi.fn(),
        'guid-unsub',
        vi.fn(),
      );

      datafeed.unsubscribeBars('guid-unsub');

      expect(clearIntervalSpy).toHaveBeenCalledOnce();
    });

    it('is a no-op when unsubscribeBars is called with an unknown guid', () => {
      mockFetchEmpty();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );

      expect(() => datafeed.unsubscribeBars('unknown-guid')).not.toThrow();
      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    it('manages multiple independent subscriptions without cross-contamination', async () => {
      const candle1 = makeCandle(2_000_000_000_000);
      const candle2 = makeCandle(2_100_000_000_000);

      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          const candle = callCount++ === 0 ? candle1 : candle2;
          return Promise.resolve({
            json: async () => ({ candles: [candle] }),
            ok: true,
          });
        }),
      );

      const datafeed = createDatafeed(
        AMOUNT_ASSET,
        PRICE_ASSET,
        AMOUNT_NAME,
        PRICE_NAME,
        MATCHER_URL,
      );
      const onTick1 = vi.fn();
      const onTick2 = vi.fn();

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        onTick1,
        'guid-multi-1',
        vi.fn(),
      );

      datafeed.subscribeBars(
        {} as Parameters<typeof datafeed.subscribeBars>[0],
        '60' as Parameters<typeof datafeed.subscribeBars>[1],
        onTick2,
        'guid-multi-2',
        vi.fn(),
      );

      await vi.waitFor(() => {
        expect(onTick1).toHaveBeenCalled();
        expect(onTick2).toHaveBeenCalled();
      });

      // Each subscription received its own candle
      const [bar1] = onTick1.mock.calls[0]! as [{ time: number }];
      const [bar2] = onTick2.mock.calls[0]! as [{ time: number }];
      expect(bar1.time).toBe(candle1.time);
      expect(bar2.time).toBe(candle2.time);

      datafeed.unsubscribeBars('guid-multi-1');
      datafeed.unsubscribeBars('guid-multi-2');
    });
  });
});
