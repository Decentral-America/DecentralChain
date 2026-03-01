import { describe, it, expect, beforeEach } from 'vitest';
import { getAssetData } from '../assetData';
import { Asset, Money } from '../../src/index';

let fakeEIGHT: Asset;
let fakeFOUR: Asset;
let fakeZERO: Asset;

describe('Money', () => {
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
  });

  describe('creating instances', () => {
    it('should be an instance of Money', () => {
      const money = new Money(10, fakeEIGHT);
      expect(Money.isMoney(money)).toBe(true);
      expect(Asset.isAsset(money.asset)).toBe(true);
    });

    it('round floor', () => {
      const money1 = new Money(19.9, fakeZERO);
      const money2 = Money.fromTokens(1.56, money1.asset);
      expect(money1.toCoins()).toBe('19');
      expect(money1.toTokens()).toBe('19');
      expect(money2.toCoins()).toBe('1');
    });
  });

  describe('core functionality', () => {
    it('should convert Money to tokens and to coins', () => {
      const money8 = new Money(100000000, fakeEIGHT);
      expect(money8.toTokens()).toBe('1.00000000');
      expect(money8.toCoins()).toBe('100000000');

      const money4 = new Money(10000, fakeFOUR);
      expect(money4.toTokens()).toBe('1.0000');
      expect(money4.toCoins()).toBe('10000');
    });

    it('should drop insignificant digits', () => {
      const money0 = new Money('1.123', fakeZERO);
      expect(money0.toTokens()).toBe('1');
      expect(money0.toCoins()).toBe('1');

      const money8 = new Money('1.123', fakeZERO);
      expect(money8.toTokens()).toBe('1');
      expect(money8.toCoins()).toBe('1');
      expect(money8.toFormat()).toBe('1');
    });

    it('toFormat', () => {
      const money8 = new Money('123', fakeZERO);
      expect(money8.toFormat()).toBe('123');
      expect(money8.toFormat(1)).toBe('123.0');
    });

    it('safeSub', () => {
      const money0 = Money.fromTokens(10, fakeZERO);
      const money1 = Money.fromTokens(10, fakeZERO);
      const money2 = Money.fromTokens(10, fakeFOUR);

      expect(money0.safeSub(money2).toFormat()).toBe('10');
      expect(money0.safeSub(money1).toFormat()).toBe('0');
    });

    it('times', () => {
      const money0 = Money.fromTokens(2, fakeZERO);
      const money1 = Money.fromTokens(4, fakeZERO);
      const money2 = Money.fromTokens(5, fakeZERO);

      expect(money0.times(money2).toFormat()).toBe('10');
      expect(money0.times(money1).toFormat()).toBe('8');
    });

    it('div', () => {
      const money0 = Money.fromTokens(10, fakeZERO);
      const money1 = Money.fromTokens(5, fakeZERO);
      const money2 = Money.fromTokens(2, fakeZERO);

      expect(money0.div(money2).toFormat()).toBe('5');
      expect(money0.div(money1).toFormat()).toBe('2');
    });

    it('toNonNegative', () => {
      const money0 = Money.fromTokens(5, fakeZERO);
      const money1 = Money.fromTokens(10, fakeZERO);

      expect(money0.sub(money1).toNonNegative().toFormat()).toBe('0');
      expect(money0.toNonNegative().toFormat()).toBe('5');
    });
  });

  describe('arithmetic operations', () => {
    it('add and plus', () => {
      const a = Money.fromTokens(3, fakeZERO);
      const b = Money.fromTokens(7, fakeZERO);
      expect(a.add(b).toFormat()).toBe('10');
      expect(a.plus(b).toFormat()).toBe('10');
    });

    it('sub and minus', () => {
      const a = Money.fromTokens(10, fakeZERO);
      const b = Money.fromTokens(3, fakeZERO);
      expect(a.sub(b).toFormat()).toBe('7');
      expect(a.minus(b).toFormat()).toBe('7');
    });

    it('should throw on mismatched assets', () => {
      const a = Money.fromTokens(1, fakeZERO);
      const b = Money.fromTokens(1, fakeFOUR);
      expect(() => a.add(b)).toThrow('different assets');
    });
  });

  describe('arithmetic comparisons', () => {
    it('eq', () => {
      const a = Money.fromTokens(5, fakeZERO);
      const b = Money.fromTokens(5, fakeZERO);
      const c = Money.fromTokens(3, fakeZERO);
      expect(a.eq(b)).toBe(true);
      expect(a.eq(c)).toBe(false);
    });

    it('lt / lte / gt / gte', () => {
      const small = Money.fromTokens(1, fakeZERO);
      const big = Money.fromTokens(10, fakeZERO);
      expect(small.lt(big)).toBe(true);
      expect(small.lte(big)).toBe(true);
      expect(big.gt(small)).toBe(true);
      expect(big.gte(small)).toBe(true);
      expect(small.gt(big)).toBe(false);
    });
  });

  describe('static methods', () => {
    it('max', () => {
      const a = Money.fromTokens(1, fakeZERO);
      const b = Money.fromTokens(5, fakeZERO);
      const c = Money.fromTokens(3, fakeZERO);
      expect(Money.max(a, b, c).eq(b)).toBe(true);
    });

    it('min', () => {
      const a = Money.fromTokens(1, fakeZERO);
      const b = Money.fromTokens(5, fakeZERO);
      const c = Money.fromTokens(3, fakeZERO);
      expect(Money.min(a, b, c).eq(a)).toBe(true);
    });

    it('fromTokens and fromCoins', () => {
      const fromTokens = Money.fromTokens(1, fakeEIGHT);
      const fromCoins = Money.fromCoins(100000000, fakeEIGHT);
      expect(fromTokens.eq(fromCoins)).toBe(true);
    });

    it('convert', () => {
      const money = Money.fromTokens(10, fakeEIGHT);
      const converted = money.convertTo(fakeFOUR, 2);
      expect(Money.isMoney(converted)).toBe(true);
      expect(converted.asset.id).toBe('FOUR');
    });
  });

  describe('serialization', () => {
    it('toJSON', () => {
      const money = Money.fromTokens(1.5, fakeEIGHT);
      const json = money.toJSON();
      expect(json.assetId).toBe('EIGHT');
      expect(json.tokens).toBe('1.50000000');
    });

    it('toString', () => {
      const money = Money.fromTokens(1.5, fakeEIGHT);
      expect(money.toString()).toBe('1.50000000 EIGHT');
    });
  });
});
