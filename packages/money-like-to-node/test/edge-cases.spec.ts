import { Asset, BigNumber, Money } from '@decentralchain/data-entities';
import { describe, expect, it } from 'vitest';
import { TYPES } from '../src/constants/index.js';
import { convert } from '../src/converters/index.js';
import { node, toNode } from '../src/toNodeEntities/index.js';
import {
  defaultTo,
  getAssetId,
  getCoins,
  has,
  head,
  ifElse,
  isStopSponsorship,
  length,
  map,
  pipe,
  prop,
} from '../src/utils/index.js';
import { DCC_ASSET } from './transactionData.js';

// ---------------------------------------------------------------------------
// Test Assets
// ---------------------------------------------------------------------------
const BTC_ASSET = new Asset({
  description: 'Bitcoin Token',
  height: 257457,
  id: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  name: 'WBTC',
  precision: 8,
  quantity: 2100000000000000,
  reissuable: false,
  sender: '3PC4roN512iugc6xGVTTM2XkoWKEdSiiscd',
  timestamp: new Date(1480690876160),
});

// ---------------------------------------------------------------------------
// 1. Error Handling — Unknown / Invalid Transaction Types
// ---------------------------------------------------------------------------
describe('Error handling', () => {
  it('toNode throws on unknown transaction type', () => {
    const unknownTx = {
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: Date.now(),
      type: 999,
      version: 1,
    };

    expect(() => toNode(unknownTx as any)).toThrow('Unknown transaction type!');
  });

  it('node.alias throws when required fields are missing', () => {
    const badAlias = {
      // fee missing!
      alias: 'testname',
      senderPublicKey: 'abc',
      timestamp: Date.now(),
      type: TYPES.ALIAS,
      version: 1,
    };

    expect(() => node.alias(badAlias as any)).toThrow(/fee/);
  });

  it('node.alias throws on invalid alias characters', () => {
    const badAlias = {
      alias: 'INVALID!!!',
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: Date.now(),
      type: TYPES.ALIAS,
      version: 1,
    };

    expect(() => node.alias(badAlias as any)).toThrow();
  });

  it('node.alias throws on alias that is too short', () => {
    const badAlias = {
      alias: 'ab',
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: Date.now(),
      type: TYPES.ALIAS,
      version: 1,
    };

    expect(() => node.alias(badAlias as any)).toThrow();
  });

  it('node.alias throws on alias that is too long', () => {
    const badAlias = {
      alias: 'a'.repeat(31),
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: Date.now(),
      type: TYPES.ALIAS,
      version: 1,
    };

    expect(() => node.alias(badAlias as any)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. Boundary Values — Large Number Precision (Critical for Money)
// ---------------------------------------------------------------------------
describe('Boundary values — large number precision', () => {
  it('preserves very large integer values without loss (21 digits)', () => {
    const largeIssue = {
      chainId: 87,
      description: 'large number test',
      fee: new Money(100000000, DCC_ASSET),
      name: 'large',
      precision: 8,
      quantity: new BigNumber('999999999999999999999'),
      reissuable: false,
      script: null,
      senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
      timestamp: 1555398380418,
      type: TYPES.ISSUE,
      version: 1,
    };

    const result = toNode(largeIssue);
    expect(result.quantity).toBe('999999999999999999999');
  });

  it('preserves 30+ digit quantity values exactly', () => {
    const hugeQuantity = '560164651464654056161651560132';
    const issueTx = {
      chainId: 87,
      description: 'huge quantity test',
      fee: new Money(100000000, DCC_ASSET),
      name: 'huge',
      precision: 8,
      quantity: new BigNumber(hugeQuantity),
      reissuable: true,
      script: null,
      senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
      timestamp: 1555398380418,
      type: TYPES.ISSUE,
      version: 1,
    };

    const result = toNode(issueTx);
    expect(result.quantity).toBe(hugeQuantity);
  });

  it('handles zero money amount correctly', () => {
    const transfer = {
      amount: new Money(0, DCC_ASSET),
      fee: new Money(100000, DCC_ASSET),
      recipient: 'recipient',
      senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
      timestamp: 1555398380418,
      type: TYPES.TRANSFER,
      version: 1,
    };

    const result = toNode(transfer);
    expect(result.amount).toBe('0');
  });

  it('handles fee as string (raw coins)', () => {
    const leaseTx = {
      amount: { assetId: 'DCC', coins: '100000000' },
      fee: '10000',
      recipient: 'merry',
      senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
      timestamp: 1555398380418,
      type: TYPES.LEASE,
      version: 1,
    };

    const result = toNode(leaseTx);
    expect(result.fee).toBe('10000');
    expect(result.amount).toBe('100000000');
  });
});

// ---------------------------------------------------------------------------
// 3. Monetary Utility Functions — Comprehensive Edge Cases
// ---------------------------------------------------------------------------
describe('getCoins — all input forms', () => {
  it('extracts coins from Money object', () => {
    expect(getCoins(new Money('500', DCC_ASSET))).toBe('500');
  });

  it('extracts coins from BigNumber', () => {
    expect(getCoins(new BigNumber('123456789012345678'))).toBe('123456789012345678');
  });

  it('extracts coins from money-like { coins, assetId }', () => {
    expect(getCoins({ assetId: 'DCC', coins: '42' })).toBe('42');
  });

  it('coerces numeric coins from money-like', () => {
    expect(getCoins({ assetId: 'DCC', coins: 42 })).toBe('42');
  });

  it('coerces string TLong', () => {
    expect(getCoins('99999')).toBe('99999');
  });

  it('coerces numeric TLong', () => {
    expect(getCoins(123)).toBe('123');
  });

  it('returns null for null input', () => {
    expect(getCoins(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getCoins(undefined)).toBeNull();
  });
});

describe('getAssetId — all input forms', () => {
  it('returns asset id from Money object', () => {
    expect(getAssetId(new Money('100', DCC_ASSET))).toBeNull();
  });

  it('returns asset id from Money object with BTC', () => {
    expect(getAssetId(new Money('100', BTC_ASSET))).toBe(BTC_ASSET.id);
  });

  it('returns assetId from money-like object', () => {
    expect(getAssetId({ assetId: 'MYTOKEN', coins: '100' })).toBe('MYTOKEN');
  });

  it('returns null for BigNumber (no asset info)', () => {
    expect(getAssetId(new BigNumber('100'))).toBeNull();
  });

  it('returns null for string TLong', () => {
    expect(getAssetId('100')).toBeNull();
  });

  it('returns null for numeric TLong', () => {
    expect(getAssetId(42)).toBeNull();
  });

  it('returns null for null', () => {
    expect(getAssetId(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getAssetId(undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. isStopSponsorship — Financial Edge Cases
// ---------------------------------------------------------------------------
describe('isStopSponsorship', () => {
  it('returns true for string "0" (stop sponsoring)', () => {
    expect(isStopSponsorship('0')).toBe(true);
  });

  it('returns true for numeric 0 (defensive)', () => {
    expect(isStopSponsorship(0)).toBe(true);
  });

  it('returns true for null (no value)', () => {
    expect(isStopSponsorship(null)).toBe(true);
  });

  it('returns true for undefined (no value)', () => {
    expect(isStopSponsorship(undefined)).toBe(true);
  });

  it('returns true for NaN-producing string', () => {
    expect(isStopSponsorship('abc')).toBe(true);
  });

  it('returns false for positive numeric amount', () => {
    expect(isStopSponsorship(100)).toBe(false);
  });

  it('returns false for positive string amount', () => {
    expect(isStopSponsorship('100000')).toBe(false);
  });

  it('returns false for string "1"', () => {
    expect(isStopSponsorship('1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Utility Functions — Correctness
// ---------------------------------------------------------------------------
describe('Utility functions', () => {
  it('head returns first element', () => {
    expect(head([10, 20, 30])).toBe(10);
  });

  it('head returns undefined for empty array', () => {
    expect(head([])).toBeUndefined();
  });

  it('defaultTo returns value when data is present', () => {
    expect(defaultTo(0)(42)).toBe(42);
  });

  it('defaultTo returns default when data is null', () => {
    expect(defaultTo('fallback')(null)).toBe('fallback');
  });

  it('defaultTo returns default when data is undefined', () => {
    expect(defaultTo(99)(undefined)).toBe(99);
  });

  it('defaultTo preserves falsy non-nullish values (0, empty string)', () => {
    expect(defaultTo(99)(0)).toBe(0);
    expect(defaultTo('fallback')('')).toBe('');
  });

  it('length works for strings', () => {
    expect(length('hello')).toBe(5);
  });

  it('length works for arrays', () => {
    expect(length([1, 2, 3])).toBe(3);
  });

  it('ifElse takes resolve branch on true', () => {
    const fn = ifElse(
      (x: number) => x > 0,
      (x: number) => x * 2,
      (x: number) => x * -1,
    );
    expect(fn(5)).toBe(10);
  });

  it('ifElse takes reject branch on false', () => {
    const fn = ifElse(
      (x: number) => x > 0,
      (x: number) => x * 2,
      (x: number) => x * -1,
    );
    expect(fn(-3)).toBe(3);
  });

  it('has checks property existence', () => {
    expect(has('a', { a: 1 })).toBe(true);
    expect(has('b', { a: 1 })).toBe(false);
  });

  it('has works in curried form', () => {
    const hasName = has('name');
    expect(hasName({ name: 'test' })).toBe(true);
    expect(hasName({})).toBe(false);
  });

  it('map transforms array elements', () => {
    expect(map((x: number) => x * 2, [1, 2, 3])).toEqual([2, 4, 6]);
  });

  it('map works in curried form', () => {
    const double = map((x: number) => x * 2);
    expect(double([1, 2, 3])).toEqual([2, 4, 6]);
  });

  it('pipe composes functions left-to-right', () => {
    const fn = pipe(
      (x: number) => x + 1,
      (x: number) => x * 2,
    );
    expect(fn(3)).toBe(8);
  });

  it('prop extracts property', () => {
    expect(prop('x', { x: 42, y: 7 })).toBe(42);
  });

  it('prop works in curried form', () => {
    const getX = prop<{ x: number }, 'x'>('x');
    expect(getX({ x: 42 })).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// 6. node.* Named Converters — Spot-Check Individual Types
// ---------------------------------------------------------------------------
describe('node.* named converters', () => {
  it('node.issue converts Money to node format', () => {
    const result = node.issue({
      chainId: 87,
      description: 'desc',
      fee: new Money(100, DCC_ASSET),
      name: 'token',
      precision: 2,
      quantity: new BigNumber('5000'),
      reissuable: true,
      script: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ISSUE,
      version: 1,
    });

    expect(result.fee).toBe('100');
    expect(result.quantity).toBe('5000');
    expect(result.decimals).toBe(2);
    expect(result.name).toBe('token');
  });

  it('node.transfer converts amounts and extracts assetId', () => {
    const result = node.transfer({
      amount: new Money(500, BTC_ASSET),
      fee: new Money(100, DCC_ASSET),
      recipient: 'dest',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.TRANSFER,
      version: 1,
    });

    expect(result.fee).toBe('100');
    expect(result.amount).toBe('500');
    expect(result.assetId).toBe(BTC_ASSET.id);
    expect(result.feeAssetId).toBeNull();
    expect(result.recipient).toBe('dest');
  });

  it('node.burn extracts assetId from quantity money-like', () => {
    const result = node.burn({
      chainId: 87,
      fee: '1000',
      quantity: { assetId: BTC_ASSET.id, coins: '500' },
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.BURN,
      version: 1,
    });

    expect(result.amount).toBe('500');
    expect(result.assetId).toBe(BTC_ASSET.id);
  });

  it('node.data converts integer values to strings', () => {
    const result = node.data({
      data: [
        { key: 'num', type: 'integer', value: 42 },
        { key: 'str', type: 'string', value: 'hello' },
        { key: 'bool', type: 'boolean', value: true },
      ],
      fee: '500',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.DATA,
      version: 1,
    });

    expect(result.data[0]?.value).toBe('42');
    expect(result.data[1]?.value).toBe('hello');
    expect(result.data[2]?.value).toBe(true);
  });

  it('node.sponsorship returns null minSponsoredAssetFee when stopping', () => {
    const result = node.sponsorship({
      fee: '1000',
      minSponsoredAssetFee: new Money(0, BTC_ASSET),
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SPONSORSHIP,
      version: 1,
    });

    expect(result.assetId).toBe(BTC_ASSET.id);
    expect(result.minSponsoredAssetFee).toBeNull();
  });

  it('node.invokeScript handles null call and payment', () => {
    const result = node.invokeScript({
      chainId: 87,
      dApp: 'dapp-address',
      fee: new Money(100, DCC_ASSET),
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT,
      version: 1,
    });

    expect(result.call).toBeNull();
    expect(result.payment).toBeNull();
    expect(result.feeAssetId).toBeNull();
  });

  it('node.invokeScript converts call args and payment', () => {
    const result = node.invokeScript({
      call: {
        args: [
          { type: 'integer', value: 42 },
          { type: 'string', value: 'hello' },
        ],
        function: 'stake',
      },
      chainId: 87,
      dApp: 'dapp-address',
      fee: new Money(100, DCC_ASSET),
      payment: [new Money(200, BTC_ASSET)],
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT,
      version: 1,
    });

    expect(result.call?.function).toBe('stake');
    expect(result.call?.args[0]).toEqual({ type: 'integer', value: '42' });
    expect(result.call?.args[1]).toEqual({ type: 'string', value: 'hello' });
    expect(result.payment?.[0]).toEqual({ amount: '200', assetId: BTC_ASSET.id });
  });

  it('node.order converts exchange order', () => {
    const result = node.order({
      amount: { assetId: BTC_ASSET.id, coins: '200' },
      expiration: 2000,
      matcherFee: { assetId: 'DCC', coins: '300' },
      matcherPublicKey: 'matcher',
      orderType: 'buy' as const,
      price: { assetId: 'DCC', coins: '100' },
      proofs: ['proof1'],
      senderPublicKey: 'sender',
      timestamp: 1000,
      version: 1,
    });

    expect(result.price).toBe('100');
    expect(result.amount).toBe('200');
    expect(result.matcherFee).toBe('300');
    expect(result.assetPair).toEqual({
      amountAsset: BTC_ASSET.id,
      priceAsset: null,
    });
  });
});

// ---------------------------------------------------------------------------
// 7. convert() Function — Generic Converter
// ---------------------------------------------------------------------------
describe('convert() function', () => {
  it('converts a simple transaction (alias)', () => {
    const aliasTx = {
      alias: 'myname',
      fee: 500,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ALIAS as 10,
      version: 1 as const,
    };

    const result = convert(aliasTx, (val: number) => String(val));
    expect(result.fee).toBe('500');
    expect(result.alias).toBe('myname');
  });

  it('converts an exchange order', () => {
    const orderData = {
      amount: 200,
      expiration: 2000,
      matcherFee: 300,
      matcherPublicKey: 'matcher',
      orderType: 'buy' as const,
      price: 100,
      proofs: ['proof1'],
      senderPublicKey: 'sender',
      timestamp: 1000,
      version: 1 as const,
    };

    const result = convert(orderData, (val: number) => String(val));
    expect(result.price).toBe('100');
    expect(result.amount).toBe('200');
    expect(result.matcherFee).toBe('300');
  });

  it('throws on unknown type in convert()', () => {
    const bad = {
      fee: 0,
      senderPublicKey: 'x',
      timestamp: 0,
      type: 999,
      version: 1,
    };

    expect(() => convert(bad as any, String)).toThrow('Unknown transaction type!');
  });
});

// ---------------------------------------------------------------------------
// 8. Timestamp Auto-Generation
// ---------------------------------------------------------------------------
describe('Timestamp auto-generation', () => {
  it('generates timestamp close to now when omitted', () => {
    const before = Date.now();
    const result = toNode({
      alias: 'testname',
      fee: '100',
      senderPublicKey: 'abc',
      type: TYPES.ALIAS,
      version: 1,
    });
    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('preserves explicit timestamp', () => {
    const result = toNode({
      alias: 'testname',
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: 1234567890,
      type: TYPES.ALIAS,
      version: 1,
    });

    expect(result.timestamp).toBe(1234567890);
  });
});

// ---------------------------------------------------------------------------
// 9. Security Audit Fixes — Critical Monetary Conversion Bugs
// ---------------------------------------------------------------------------
describe('CRITICAL: convert() data integer value 0', () => {
  it('converts integer value 0 through factory (not skipped)', () => {
    const dataTx = {
      data: [
        { key: 'zero', type: 'integer' as const, value: 0 },
        { key: 'positive', type: 'integer' as const, value: 42 },
        { key: 'str', type: 'string' as const, value: 'hello' },
      ],
      fee: 100,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.DATA as 12,
      version: 1 as const,
    };

    const result = convert(dataTx, (val: number) => String(val));
    expect(result.data[0]?.value).toBe('0');
    expect(result.data[1]?.value).toBe('42');
    expect(result.data[2]?.value).toBe('hello');
  });

  it('preserves null integer values without calling factory', () => {
    const dataTx = {
      data: [{ key: 'nullval', type: 'integer' as const, value: null }],
      fee: 100,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.DATA as 12,
      version: 1 as const,
    };

    const result = convert(dataTx as any, (val: number) => String(val));
    expect(result.data[0]?.value).toBeNull();
  });
});

describe('CRITICAL: convert() burn with amount=0', () => {
  it('uses amount field even when amount is 0', () => {
    const burnTx = {
      amount: 0,
      fee: 100,
      quantity: 999,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.BURN as 6,
      version: 1 as const,
    };

    const result = convert(burnTx as any, (val: number) => String(val));
    // Should use amount (0), NOT fall through to quantity (999)
    expect(result.amount).toBe('0');
    expect(result.quantity).toBe('0');
  });

  it('falls through to quantity when amount is undefined', () => {
    const burnTx = {
      fee: 100,
      quantity: 500,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.BURN as 6,
      version: 1 as const,
    };

    const result = convert(burnTx as any, (val: number) => String(val));
    expect(result.amount).toBe('500');
    expect(result.quantity).toBe('500');
  });
});

describe('CRITICAL: convert() invokeScript null call/payment', () => {
  it('returns null call when tx.call is null (not { args: undefined })', () => {
    const invokeTx = {
      call: null,
      chainId: 87,
      dApp: 'dapp',
      fee: 100,
      feeAssetId: 'DCC',
      payment: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT as 16,
      version: 1 as const,
    };

    const result = convert(invokeTx as any, (val: number) => String(val));
    expect(result.call).toBeNull();
    expect(result.payment).toBeNull();
  });

  it('converts call args when call is present', () => {
    const invokeTx = {
      call: {
        args: [
          { type: 'integer' as const, value: 0 },
          { type: 'string' as const, value: 'hello' },
        ],
        function: 'stake',
      },
      chainId: 87,
      dApp: 'dapp',
      fee: 100,
      feeAssetId: 'DCC',
      payment: [{ amount: 200, assetId: 'DCC' }],
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT as 16,
      version: 1 as const,
    };

    const result = convert(invokeTx as any, (val: number) => String(val));
    expect(result.call).toEqual({
      args: [
        { type: 'integer', value: '0' },
        { type: 'string', value: 'hello' },
      ],
      function: 'stake',
    });
    expect(result.payment).toEqual([{ amount: '200', assetId: 'DCC' }]);
  });
});

describe('MEDIUM: issue decimals=0 preserved correctly', () => {
  it('preserves decimals=0 (does not fall through to precision)', () => {
    const result = node.issue({
      chainId: 87,
      decimals: 0,
      description: 'no decimals',
      fee: '100',
      name: 'indivisible',
      quantity: '1000000',
      reissuable: false,
      script: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ISSUE,
      version: 1,
    });

    expect(result.decimals).toBe(0);
  });

  it('falls through to precision when decimals is undefined', () => {
    const result = node.issue({
      chainId: 87,
      description: 'uses precision',
      fee: '100',
      name: 'precise',
      precision: 8,
      quantity: '1000000',
      reissuable: false,
      script: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ISSUE,
      version: 1,
    });

    expect(result.decimals).toBe(8);
  });

  it('defaults to 0 when neither decimals nor precision provided', () => {
    const result = node.issue({
      chainId: 87,
      description: 'no decimals field',
      fee: '100',
      name: 'default',
      quantity: '1000000',
      reissuable: false,
      script: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ISSUE,
      version: 1,
    } as any);

    expect(result.decimals).toBe(0);
  });
});

describe('CRITICAL: toNode data with integer value 0', () => {
  it('converts integer value 0 to string "0" (toNodeEntities path)', () => {
    const result = node.data({
      data: [
        { key: 'zero', type: 'integer', value: 0 },
        { key: 'negative', type: 'integer', value: -1 },
      ],
      fee: '500',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.DATA,
      version: 1,
    });

    expect(result.data[0]?.value).toBe('0');
    expect(result.data[1]?.value).toBe('-1');
  });
});

// ---------------------------------------------------------------------------
// 10. CRITICAL: Unsafe Integer Detection (Prevents Silent Money Corruption)
// ---------------------------------------------------------------------------
describe('CRITICAL: getCoins rejects unsafe integers', () => {
  it('throws when number exceeds MAX_SAFE_INTEGER', () => {
    expect(() => getCoins(Number.MAX_SAFE_INTEGER + 2)).toThrow('Unsafe integer detected');
  });

  it('throws when IMoneyLike coins exceeds MAX_SAFE_INTEGER as number', () => {
    expect(() => getCoins({ assetId: 'DCC', coins: Number.MAX_SAFE_INTEGER + 2 })).toThrow(
      'Unsafe integer detected',
    );
  });

  it('accepts MAX_SAFE_INTEGER exactly', () => {
    expect(getCoins(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
  });

  it('accepts string representation of large numbers (safe path)', () => {
    expect(getCoins('99999999999999999999999')).toBe('99999999999999999999999');
  });

  it('accepts IMoneyLike with string coins (safe path)', () => {
    expect(getCoins({ assetId: 'DCC', coins: '99999999999999999999999' })).toBe(
      '99999999999999999999999',
    );
  });

  it('throws for negative unsafe integers', () => {
    expect(() => getCoins(-Number.MAX_SAFE_INTEGER - 2)).toThrow('Unsafe integer detected');
  });

  it('accepts negative safe integers', () => {
    expect(getCoins(-1)).toBe('-1');
  });

  it('throws for Infinity', () => {
    expect(() => getCoins(Infinity)).toThrow('Unsafe integer detected');
  });

  it('throws for NaN', () => {
    expect(() => getCoins(NaN)).toThrow('Unsafe integer detected');
  });
});

// ---------------------------------------------------------------------------
// 11. CRITICAL: data.ts throws on unknown data entry types
// ---------------------------------------------------------------------------
describe('CRITICAL: data.ts rejects unknown data entry types', () => {
  it('throws on unknown data type instead of silently returning null', () => {
    expect(() =>
      node.data({
        data: [{ key: 'bad', type: 'unknown_type' as any, value: 'x' }],
        fee: '500',
        senderPublicKey: 'abc',
        timestamp: 1000,
        type: TYPES.DATA,
        version: 1,
      }),
    ).toThrow('Unknown data entry type');
  });
});

// ---------------------------------------------------------------------------
// 12. Runtime Immutability of Constants
// ---------------------------------------------------------------------------
describe('Constants are frozen at runtime', () => {
  it('TYPES object is frozen', () => {
    expect(Object.isFrozen(TYPES)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 13. convert() — Full Transaction Type Coverage
// ---------------------------------------------------------------------------
describe('convert() — full transaction type coverage', () => {
  const toStr = (val: number) => String(val);

  it('converts issue transaction', () => {
    const tx = {
      chainId: 87,
      decimals: 2,
      description: 'desc',
      fee: 100,
      name: 'token',
      quantity: 5000,
      reissuable: true,
      script: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.ISSUE as 3,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.quantity).toBe('5000');
  });

  it('converts transfer transaction', () => {
    const tx = {
      amount: 500,
      assetId: 'DCC',
      attachment: '',
      fee: 100,
      feeAssetId: 'DCC',
      recipient: 'dest',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.TRANSFER as 4,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.amount).toBe('500');
  });

  it('converts reissue transaction', () => {
    const tx = {
      assetId: 'BTC',
      chainId: 87,
      fee: 100,
      quantity: 2000,
      reissuable: false,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.REISSUE as 5,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.quantity).toBe('2000');
  });

  it('converts lease transaction', () => {
    const tx = {
      amount: 9999,
      fee: 100,
      recipient: 'node',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.LEASE as 8,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.amount).toBe('9999');
  });

  it('converts cancel lease transaction', () => {
    const tx = {
      chainId: 87,
      fee: 100,
      leaseId: 'lease123',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.CANCEL_LEASE as 9,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
  });

  it('converts mass transfer transaction', () => {
    const tx = {
      assetId: 'DCC',
      attachment: 'memo',
      fee: 100,
      senderPublicKey: 'abc',
      timestamp: 1000,
      transfers: [
        { amount: 10, recipient: 'a' },
        { amount: 20, recipient: 'b' },
      ],
      type: TYPES.MASS_TRANSFER as 11,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.transfers).toEqual([
      { amount: '10', recipient: 'a' },
      { amount: '20', recipient: 'b' },
    ]);
  });

  it('converts set script transaction', () => {
    const tx = {
      chainId: 87,
      fee: 100,
      script: 'base64:script',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SET_SCRIPT as 13,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
  });

  it('converts sponsorship transaction', () => {
    const tx = {
      assetId: 'TOKEN',
      fee: 100,
      minSponsoredAssetFee: 50,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SPONSORSHIP as 14,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.minSponsoredAssetFee).toBe('50');
  });

  it('converts sponsorship with null minSponsoredAssetFee', () => {
    const tx = {
      assetId: 'TOKEN',
      fee: 100,
      minSponsoredAssetFee: null,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SPONSORSHIP as 14,
      version: 1 as const,
    };
    const result = convert(tx as any, toStr);
    expect(result.minSponsoredAssetFee).toBeNull();
  });

  it('converts set asset script transaction', () => {
    const tx = {
      assetId: 'TOKEN',
      chainId: 87,
      fee: 100,
      script: 'base64:script',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SET_ASSET_SCRIPT as 15,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
  });

  it('converts invoke script transaction with call and payment', () => {
    const tx = {
      call: {
        args: [
          { type: 'integer' as const, value: 42 },
          { type: 'string' as const, value: 'hi' },
        ],
        function: 'stake',
      },
      chainId: 87,
      dApp: 'dapp',
      fee: 100,
      feeAssetId: 'DCC',
      payment: [{ amount: 200, assetId: 'DCC' }],
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT as 16,
      version: 1 as const,
    };
    const result = convert(tx as any, toStr);
    expect(result.fee).toBe('100');
    expect(result.call?.args[0]).toEqual({ type: 'integer', value: '42' });
    expect(result.payment?.[0]?.amount).toBe('200');
  });

  it('converts invoke script with undefined payment (falsy but not null)', () => {
    const tx = {
      call: null,
      chainId: 87,
      dApp: 'dapp',
      fee: 100,
      feeAssetId: 'DCC',
      payment: undefined,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.INVOKE_SCRIPT as 16,
      version: 1 as const,
    };
    const result = convert(tx as any, toStr);
    expect(result.payment).toBeUndefined();
  });

  it('converts update asset info transaction', () => {
    const tx = {
      assetId: 'TOKEN',
      description: 'New Desc',
      fee: 100,
      name: 'New Name',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.UPDATE_ASSET_INFO as 17,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
  });

  it('converts data transaction with all entry types', () => {
    const tx = {
      data: [
        { key: 'int', type: 'integer' as const, value: 99 },
        { key: 'str', type: 'string' as const, value: 'hello' },
        { key: 'bool', type: 'boolean' as const, value: true },
        { key: 'bin', type: 'binary' as const, value: 'base64' },
      ],
      fee: 100,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.DATA as 12,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.data[0]?.value).toBe('99');
    expect(result.data[1]?.value).toBe('hello');
    expect(result.data[2]?.value).toBe(true);
    expect(result.data[3]?.value).toBe('base64');
  });

  it('converts exchange transaction fully', () => {
    const orderBase = {
      expiration: 2000,
      matcherPublicKey: 'matcher',
      proofs: ['p'],
      senderPublicKey: 'sender',
      timestamp: 1000,
      version: 1 as const,
    };
    const tx = {
      amount: 200,
      buyMatcherFee: 10,
      fee: 100,
      order1: { ...orderBase, amount: 200, matcherFee: 10, orderType: 'buy' as const, price: 50 },
      order2: {
        ...orderBase,
        amount: 200,
        matcherFee: 10,
        orderType: 'sell' as const,
        price: 50,
      },
      price: 50,
      sellMatcherFee: 10,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.EXCHANGE as 7,
      version: 1 as const,
    };
    const result = convert(tx, toStr);
    expect(result.fee).toBe('100');
    expect(result.price).toBe('50');
    expect(result.amount).toBe('200');
    expect(result.buyMatcherFee).toBe('10');
    expect(result.sellMatcherFee).toBe('10');
    expect(result.order1.price).toBe('50');
    expect(result.order2.amount).toBe('200');
  });

  it('converts burn with quantity fallback', () => {
    const tx = {
      fee: 100,
      quantity: 777,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.BURN as 6,
      version: 1 as const,
    };
    const result = convert(tx as any, toStr);
    expect(result.amount).toBe('777');
    expect(result.quantity).toBe('777');
  });
});

// ---------------------------------------------------------------------------
// 14. toNode() — Missing Entity Switch Cases
// ---------------------------------------------------------------------------
describe('toNode() — additional entity types', () => {
  it('converts reissue via toNode', () => {
    const result = toNode({
      assetId: 'TOKEN',
      chainId: 87,
      fee: '100',
      quantity: '5000',
      reissuable: true,
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.REISSUE,
      version: 1,
    });
    expect(result.quantity).toBe('5000');
    expect(result.assetId).toBe('TOKEN');
  });

  it('converts updateAssetInfo via toNode', () => {
    const result = toNode({
      assetId: 'TOKEN',
      description: 'Desc',
      fee: '100',
      name: 'New',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.UPDATE_ASSET_INFO,
      version: 1,
    });
    expect(result.name).toBe('New');
  });

  it('converts setAssetScript via toNode', () => {
    const result = toNode({
      assetId: 'TOKEN',
      chainId: 87,
      fee: '100',
      script: 'base64:abc',
      senderPublicKey: 'abc',
      timestamp: 1000,
      type: TYPES.SET_ASSET_SCRIPT,
      version: 1,
    });
    expect(result.script).toBe('base64:abc');
  });

  it('converts massTransfer with assetId via toNode', () => {
    const result = toNode({
      assetId: 'TOKEN',
      attachment: 'memo',
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: 1000,
      transfers: [{ amount: '10', recipient: 'a' }],
      type: TYPES.MASS_TRANSFER,
      version: 1,
    });
    expect(result.assetId).toBe('TOKEN');
    expect(result.transfers[0]?.amount).toBe('10');
  });

  it('massTransfer throws on empty transfers array (money variant)', () => {
    expect(() =>
      toNode({
        attachment: '',
        fee: '100',
        senderPublicKey: 'abc',
        timestamp: 1000,
        transfers: [],
        type: TYPES.MASS_TRANSFER,
        version: 1,
      } as any),
    ).toThrow('MassTransfer transaction must have one transfer!');
  });

  it('massTransfer extracts assetId from first transfer money item', () => {
    const result = toNode({
      attachment: 'memo',
      fee: '100',
      senderPublicKey: 'abc',
      timestamp: 1000,
      transfers: [{ amount: new Money(10, DCC_ASSET), recipient: 'a' }],
      type: TYPES.MASS_TRANSFER,
      version: 1,
    } as any);
    expect(result.assetId).toBeNull();
  });
});
