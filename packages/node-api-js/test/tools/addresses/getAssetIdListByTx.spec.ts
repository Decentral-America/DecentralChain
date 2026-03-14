import { describe, expect, it } from 'vitest';
import getAssetIdListByTx from '../../../src/tools/adresses/getAssetIdListByTx';

describe('getAssetIdListByTx – extract asset IDs from transactions', () => {
  it('extracts assetId and feeAssetId from a transfer transaction', () => {
    const tx = {
      amount: '1000',
      assetId: 'asset-abc',
      feeAssetId: 'fee-asset-xyz',
      recipient: '3M...',
      sender: '3L...',
      type: 4,
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('asset-abc');
    expect(result).toContain('fee-asset-xyz');
  });

  it('filters out null asset IDs (native DCC)', () => {
    const tx = {
      amount: '1000',
      assetId: null,
      feeAssetId: null,
      recipient: '3M...',
      sender: '3L...',
      type: 4,
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual([]);
  });

  it('extracts assetId from a burn transaction', () => {
    const tx = { amount: '100', assetId: 'burn-asset', sender: '3L...', type: 6 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['burn-asset']);
  });

  it('extracts assetId from a reissue transaction', () => {
    const tx = { assetId: 'reissue-asset', quantity: '500', sender: '3L...', type: 5 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['reissue-asset']);
  });

  it('extracts assets from exchange transaction order pairs', () => {
    const tx = {
      order1: {
        assetPair: { amountAsset: 'asset-a', priceAsset: 'asset-b' },
        matcherFeeAssetId: 'fee-asset-1',
        version: 3,
      },
      order2: {
        assetPair: { amountAsset: 'asset-a', priceAsset: 'asset-b' },
        matcherFeeAssetId: 'fee-asset-2',
        version: 3,
      },
      type: 7,
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('asset-a');
    expect(result).toContain('asset-b');
    expect(result).toContain('fee-asset-1');
    expect(result).toContain('fee-asset-2');
  });

  it('extracts assetId from mass transfer transaction', () => {
    const tx = { assetId: 'mass-asset', transfers: [], type: 11 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['mass-asset']);
  });

  it('extracts assetId from setAssetScript transaction', () => {
    const tx = { assetId: 'scripted-asset', type: 15 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['scripted-asset']);
  });

  it('extracts assetId from sponsorship transaction', () => {
    const tx = { assetId: 'sponsored-asset', type: 14 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['sponsored-asset']);
  });

  it('extracts payment assetIds from invoke transaction', () => {
    const tx = {
      feeAssetId: 'fee-3',
      payment: [{ assetId: 'pay-1' }, { assetId: 'pay-2' }],
      type: 16,
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('pay-1');
    expect(result).toContain('pay-2');
    expect(result).toContain('fee-3');
  });

  it('extracts assetId from updateAsset transaction', () => {
    const tx = { assetId: 'update-asset', type: 17 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['update-asset']);
  });

  it('returns empty array for transaction types without asset handling (e.g. alias)', () => {
    const tx = { alias: 'my-alias', type: 10 };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual([]);
  });

  it('handles arrays of transactions', () => {
    const txList = [
      { assetId: 'asset-1', feeAssetId: null, type: 4 },
      { assetId: 'asset-2', type: 6 },
    ];
    const result = getAssetIdListByTx(txList as any);
    expect(result).toContain('asset-1');
    expect(result).toContain('asset-2');
  });
});
