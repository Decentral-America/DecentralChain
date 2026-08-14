/**
 * Unit tests for the pure tx-building helpers extracted from message.ts
 * (MessageController). First step of splitting that file apart — these two
 * functions had zero test coverage despite being called on every fee/amount
 * conversion in the signing path.
 *
 * Run with:
 *   pnpm nx run cubensis-connect:test:unit
 */

import { describe, expect, it } from 'vitest';
import type { AssetDetail, AssetsRecord } from '#assets/types';
import { moneyLikeToMoney, pickDefaultTxVersion } from './messageUtils';

function makeAsset(overrides: Partial<AssetDetail> = {}): AssetDetail {
  return {
    description: '',
    displayName: 'Decentral Coin',
    height: 1,
    id: 'DCC',
    issuer: '',
    name: 'DCC',
    precision: 8,
    quantity: '0',
    reissuable: false,
    sender: '',
    timestamp: new Date(0),
    ...overrides,
  };
}

const assets: AssetsRecord = {
  DCC: makeAsset(),
  someAssetId: makeAsset({ displayName: 'Test Token', id: 'someAssetId', precision: 2 }),
};

const TRANSACTION_TYPE_TRANSFER = 4;

describe('pickDefaultTxVersion', () => {
  it('returns the first version in a non-empty array', () => {
    expect(pickDefaultTxVersion([2, 3], TRANSACTION_TYPE_TRANSFER)).toBe(2);
    expect(pickDefaultTxVersion([3], TRANSACTION_TYPE_TRANSFER)).toBe(3);
  });

  it('throws on an empty versions array', () => {
    expect(() => pickDefaultTxVersion([], TRANSACTION_TYPE_TRANSFER)).toThrow();
  });
});

describe('moneyLikeToMoney', () => {
  it('converts a coins-based amount using the default (DCC) asset', () => {
    const money = moneyLikeToMoney({ assetId: null, coins: 100000000 }, assets);
    expect(money.asset.id).toBe('DCC');
    expect(money.toCoins()).toBe('100000000');
  });

  it('converts a tokens-based amount, respecting asset precision', () => {
    const money = moneyLikeToMoney({ assetId: null, tokens: '1.5' }, assets);
    expect(money.toTokens()).toBe('1.50000000');
  });

  it('sums tokens and coins when both are present', () => {
    const money = moneyLikeToMoney({ assetId: null, coins: 50000000, tokens: '1' }, assets);
    expect(money.toCoins()).toBe('150000000');
  });

  it('resolves the referenced asset by assetId, not just DCC', () => {
    const money = moneyLikeToMoney({ assetId: 'someAssetId', coins: 100 }, assets);
    expect(money.asset.id).toBe('someAssetId');
    expect(money.asset.precision).toBe(2);
  });

  it('falls back to a plain `amount` field when neither tokens nor coins is set', () => {
    const money = moneyLikeToMoney({ amount: 42, assetId: null }, assets);
    expect(money.toCoins()).toBe('42');
  });
});
