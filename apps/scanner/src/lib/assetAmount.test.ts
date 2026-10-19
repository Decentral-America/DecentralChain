import { describe, expect, it } from 'vitest';
import {
  amountAssetIdOf,
  assetIdsOf,
  formatAssetAmount,
  isNativeAsset,
  toAssetMetaMap,
} from './assetAmount';

const AUDT = '9P2QmU7sGFLKTpECnBkfaZgXp6pGJ6hQvLvQ8fBRb6LF';
const assets = { [AUDT]: { decimals: 2, name: 'AUDT' } };

describe('formatAssetAmount', () => {
  it('formats a 2-decimal token in its own units and name (the live burn showed "0.1 DCC")', () => {
    expect(formatAssetAmount(10_000_000, AUDT, assets)).toBe('100,000 AUDT');
  });

  it('formats native DCC with 8 decimals whether the id is null, empty or "DCC"', () => {
    expect(formatAssetAmount(2_000_000_000, null, assets)).toBe('20 DCC');
    expect(formatAssetAmount('100000', '', assets)).toBe('0.001 DCC');
    expect(formatAssetAmount(100_000_000, 'DCC', assets)).toBe('1 DCC');
  });

  it('labels raw base units when the asset could not be resolved, never as DCC', () => {
    expect(formatAssetAmount(10_000_000, 'UnknownAssetId', assets)).toBe('10,000,000 units');
  });
});

describe('helpers', () => {
  it('treats null, empty and "DCC" as the native asset', () => {
    expect(isNativeAsset(null)).toBe(true);
    expect(isNativeAsset('')).toBe(true);
    expect(isNativeAsset('DCC')).toBe(true);
    expect(isNativeAsset(AUDT)).toBe(false);
  });

  it('collects distinct non-native ids', () => {
    expect(assetIdsOf(AUDT, null, 'DCC', AUDT, undefined)).toEqual([AUDT]);
  });

  it('reads the amount asset of an exchange from its order pair', () => {
    expect(
      amountAssetIdOf({ assetId: null, order1: { assetPair: { amountAsset: AUDT } }, type: 7 }),
    ).toBe(AUDT);
    expect(amountAssetIdOf({ assetId: AUDT, type: 6 })).toBe(AUDT);
    expect(amountAssetIdOf({ type: 4 })).toBeNull();
  });

  it('maps node asset details to display metadata', () => {
    expect(toAssetMetaMap(new Map([[AUDT, { decimals: 2, name: 'AUDT2' }]]))).toEqual({
      [AUDT]: { decimals: 2, name: 'AUDT2' },
    });
  });
});
