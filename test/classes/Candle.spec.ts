import { describe, it, expect } from 'vitest';
import { Candle, config } from '../../src/index';
import { type ICandleInfo } from '../../src/entities/Candle';
import { BigNumber } from '@decentralchain/bignumber';

function getCandleData(overrides: Partial<ICandleInfo> = {}): ICandleInfo {
  return {
    time: new Date('2024-01-15T12:00:00Z'),
    open: '100.5',
    close: '105.2',
    high: '110.0',
    low: '95.3',
    volume: '50000',
    quoteVolume: '5250000',
    weightedAveragePrice: '102.8',
    maxHeight: 1000,
    txsCount: 42,
    ...overrides,
  };
}

describe('Candle', () => {
  describe('creating instances', () => {
    it('should create a Candle from string values', () => {
      const candle = new Candle(getCandleData());
      expect(Candle.isCandle(candle)).toBe(true);
    });

    it('should create a Candle from numeric values', () => {
      const candle = new Candle(
        getCandleData({
          open: 100.5,
          close: 105.2,
          high: 110.0,
          low: 95.3,
          volume: 50000,
          quoteVolume: 5250000,
          weightedAveragePrice: 102.8,
        }),
      );
      expect(Candle.isCandle(candle)).toBe(true);
      expect(candle.open.toFixed(1)).toBe('100.5');
    });

    it('should create a Candle from BigNumber values', () => {
      const candle = new Candle(
        getCandleData({
          open: new BigNumber('100.5'),
          close: new BigNumber('105.2'),
          high: new BigNumber('110.0'),
          low: new BigNumber('95.3'),
          volume: new BigNumber('50000'),
          quoteVolume: new BigNumber('5250000'),
          weightedAveragePrice: new BigNumber('102.8'),
        }),
      );
      expect(candle.open.eq(new BigNumber('100.5'))).toBe(true);
    });

    it('should preserve non-BigNumber fields', () => {
      const data = getCandleData();
      const candle = new Candle(data);
      expect(candle.time).toEqual(new Date('2024-01-15T12:00:00Z'));
      expect(candle.maxHeight).toBe(1000);
      expect(candle.txsCount).toBe(42);
    });
  });

  describe('BigNumber conversions', () => {
    it('should convert all OHLCV fields to BigNumber', () => {
      const candle = new Candle(getCandleData());
      expect(candle.open).toBeInstanceOf(BigNumber);
      expect(candle.close).toBeInstanceOf(BigNumber);
      expect(candle.high).toBeInstanceOf(BigNumber);
      expect(candle.low).toBeInstanceOf(BigNumber);
      expect(candle.volume).toBeInstanceOf(BigNumber);
      expect(candle.quoteVolume).toBeInstanceOf(BigNumber);
      expect(candle.weightedAveragePrice).toBeInstanceOf(BigNumber);
    });

    it('should preserve BigNumber precision for string inputs', () => {
      const candle = new Candle(
        getCandleData({
          open: '0.00000001',
          volume: '999999999999999999',
        }),
      );
      expect(candle.open.toFixed(8)).toBe('0.00000001');
      expect(candle.volume.toFixed(0)).toBe('999999999999999999');
    });

    it('should pass through existing BigNumber instances', () => {
      const bn = new BigNumber('42.5');
      const candle = new Candle(getCandleData({ open: bn }));
      // Should be the same instance (not cloned) since toBigNumber returns as-is
      expect(candle.open).toBe(bn);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON with all fields', () => {
      const candle = new Candle(getCandleData());
      const json = candle.toJSON();
      expect(json.time).toEqual(new Date('2024-01-15T12:00:00Z'));
      expect(json.open).toBeInstanceOf(BigNumber);
      expect(json.close).toBeInstanceOf(BigNumber);
      expect(json.high).toBeInstanceOf(BigNumber);
      expect(json.low).toBeInstanceOf(BigNumber);
      expect(json.volume).toBeInstanceOf(BigNumber);
      expect(json.quoteVolume).toBeInstanceOf(BigNumber);
      expect(json.weightedAveragePrice).toBeInstanceOf(BigNumber);
      expect(json.maxHeight).toBe(1000);
      expect(json.txsCount).toBe(42);
    });

    it('should produce correct toString', () => {
      const candle = new Candle(getCandleData());
      expect(candle.toString()).toBe('[object Candle]');
    });
  });

  describe('type guard', () => {
    it('should identify Candle instances', () => {
      const candle = new Candle(getCandleData());
      expect(Candle.isCandle(candle)).toBe(true);
    });

    it('should reject non-Candle objects', () => {
      expect(Candle.isCandle({})).toBe(false);
      expect(Candle.isCandle({ time: new Date() })).toBe(false);
    });
  });

  describe('config integration', () => {
    it('should apply remapCandle config', () => {
      const original = config.get('remapCandle');
      try {
        config.set('remapCandle', (candle) => ({
          ...candle,
          open: '999',
          txsCount: 0,
        }));
        const candle = new Candle(getCandleData());
        expect(candle.open.toFixed(0)).toBe('999');
        expect(candle.txsCount).toBe(0);
        // Other fields unchanged
        expect(candle.close.toFixed(1)).toBe('105.2');
      } finally {
        config.set('remapCandle', original);
      }
    });
  });
});
