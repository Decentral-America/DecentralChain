import { describe, it, expect, beforeEach } from 'vitest';
import { getAssetData } from '../assetData';
import { BigNumber } from '@decentralchain/bignumber';
import { Asset, AssetPair, OrderPrice } from '../../src/index';

let fakeEIGHT: Asset;
let fakeFOUR: Asset;
let fakeZERO: Asset;
let pairOne: AssetPair;
let pairTwo: AssetPair;

describe('OrderPrice', () => {
  beforeEach(() => {
    fakeEIGHT = new Asset(
      getAssetData({
        id: 'EIGHT',
        name: 'Eight Precision Token',
        precision: 8,
      }),
    );

    fakeFOUR = new Asset(
      getAssetData({
        id: 'FOUR',
        name: 'Four Precision Token',
        precision: 4,
      }),
    );

    fakeZERO = new Asset(
      getAssetData({
        id: 'ZERO',
        name: 'Zero Precision Token',
        precision: 0,
      }),
    );

    pairOne = new AssetPair(fakeEIGHT, fakeZERO);
    pairTwo = new AssetPair(fakeZERO, fakeFOUR);
  });

  describe('creating instances', () => {
    it('should be an instance of OrderPrice', () => {
      const orderPrice = new OrderPrice(new BigNumber(10), pairOne);
      expect(OrderPrice.isOrderPrice(orderPrice)).toBe(true);
    });

    it('should create from matcher coins', () => {
      const orderPrice = OrderPrice.fromMatcherCoins('100000000', pairTwo);
      expect(OrderPrice.isOrderPrice(orderPrice)).toBe(true);
      expect(orderPrice.toMatcherCoins()).toBe('100000000');
    });

    it('should create from tokens', () => {
      const orderPrice = OrderPrice.fromTokens('5.0000', pairTwo);
      expect(OrderPrice.isOrderPrice(orderPrice)).toBe(true);
    });
  });

  describe('core functionality', () => {
    it('should return matcher coins as cloned BigNumber', () => {
      const orderPrice = new OrderPrice(new BigNumber(500), pairOne);
      const coins = orderPrice.getMatcherCoins();
      expect(coins.toFixed(0)).toBe('500');
    });

    it('should return tokens as cloned BigNumber', () => {
      const orderPrice = new OrderPrice(new BigNumber(500), pairOne);
      const tokens = orderPrice.getTokens();
      expect(typeof tokens.toFixed).toBe('function');
    });
  });

  describe('type guard', () => {
    it('should reject non-OrderPrice objects', () => {
      expect(OrderPrice.isOrderPrice({})).toBe(false);
      expect(OrderPrice.isOrderPrice({ pair: pairOne })).toBe(false);
    });
  });

  describe('round-trip fidelity', () => {
    it('tokens → matcherCoins → tokens should preserve value', () => {
      const price = OrderPrice.fromTokens('1.5000', pairTwo);
      const coins = price.toMatcherCoins();
      const restored = OrderPrice.fromMatcherCoins(coins, pairTwo);
      expect(restored.toTokens()).toBe(price.toTokens());
    });
  });

  describe('input validation', () => {
    it('should throw on invalid input type', () => {
      // Runtime guard for JS consumers — bypass TS typing with cast
      expect(() => OrderPrice.fromMatcherCoins({} as unknown as string, pairTwo)).toThrow(
        'Please use strings, numbers, or BigNumber',
      );
    });
  });

  describe('conversions', () => {
    it('should serialize to JSON', () => {
      const orderPrice = new OrderPrice(new BigNumber(10), pairOne);
      const json = orderPrice.toJSON();
      expect(json.amountAssetId).toBe('EIGHT');
      expect(json.priceAssetId).toBe('ZERO');
      expect(typeof json.priceTokens).toBe('string');
    });

    it('should convert to string', () => {
      const orderPrice = new OrderPrice(new BigNumber(10), pairOne);
      const str = orderPrice.toString();
      expect(str).toContain('EIGHT/ZERO');
    });

    it('should format tokens', () => {
      const orderPrice = new OrderPrice(new BigNumber(10), pairOne);
      const formatted = orderPrice.toFormat();
      expect(typeof formatted).toBe('string');
    });
  });
});
