import { describe, expect, it } from 'vitest';
import getAssetIdListByTx from '../../../src/tools/adresses/getAssetIdListByTx';

describe('getAssetIdListByTx – extract asset IDs from transactions', () => {
  it('extracts assetId and feeAssetId from a transfer transaction', () => {
    const tx = {
      type: 4,
      assetId: 'asset-abc',
      feeAssetId: 'fee-asset-xyz',
      sender: '3L...',
      recipient: '3M...',
      amount: '1000',
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('asset-abc');
    expect(result).toContain('fee-asset-xyz');
  });

  it('filters out null asset IDs (native DCC)', () => {
    const tx = {
      type: 4,
      assetId: null,
      feeAssetId: null,
      sender: '3L...',
      recipient: '3M...',
      amount: '1000',
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual([]);
  });

  it('extracts assetId from a burn transaction', () => {
    const tx = { type: 6, assetId: 'burn-asset', sender: '3L...', amount: '100' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['burn-asset']);
  });

  it('extracts assetId from a reissue transaction', () => {
    const tx = { type: 5, assetId: 'reissue-asset', sender: '3L...', quantity: '500' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['reissue-asset']);
  });

  it('extracts assets from exchange transaction order pairs', () => {
    const tx = {
      type: 7,
      order1: {
        assetPair: { amountAsset: 'asset-a', priceAsset: 'asset-b' },
        version: 3,
        matcherFeeAssetId: 'fee-asset-1',
      },
      order2: {
        assetPair: { amountAsset: 'asset-a', priceAsset: 'asset-b' },
        version: 3,
        matcherFeeAssetId: 'fee-asset-2',
      },
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('asset-a');
    expect(result).toContain('asset-b');
    expect(result).toContain('fee-asset-1');
    expect(result).toContain('fee-asset-2');
  });

  it('extracts assetId from mass transfer transaction', () => {
    const tx = { type: 11, assetId: 'mass-asset', transfers: [] };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['mass-asset']);
  });

  it('extracts assetId from setAssetScript transaction', () => {
    const tx = { type: 15, assetId: 'scripted-asset' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['scripted-asset']);
  });

  it('extracts assetId from sponsorship transaction', () => {
    const tx = { type: 14, assetId: 'sponsored-asset' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['sponsored-asset']);
  });

  it('extracts payment assetIds from invoke transaction', () => {
    const tx = {
      type: 16,
      payment: [{ assetId: 'pay-1' }, { assetId: 'pay-2' }],
      feeAssetId: 'fee-3',
    };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toContain('pay-1');
    expect(result).toContain('pay-2');
    expect(result).toContain('fee-3');
  });

  it('extracts assetId from updateAsset transaction', () => {
    const tx = { type: 17, assetId: 'update-asset' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual(['update-asset']);
  });

  it('returns empty array for transaction types without asset handling (e.g. alias)', () => {
    const tx = { type: 10, alias: 'my-alias' };
    const result = getAssetIdListByTx(tx as any);
    expect(result).toEqual([]);
  });

  it('handles arrays of transactions', () => {
    const txList = [
      { type: 4, assetId: 'asset-1', feeAssetId: null },
      { type: 6, assetId: 'asset-2' },
    ];
    const result = getAssetIdListByTx(txList as any);
    expect(result).toContain('asset-1');
    expect(result).toContain('asset-2');
  });
});
