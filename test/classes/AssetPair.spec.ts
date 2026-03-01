import { describe, it, expect, beforeEach } from 'vitest';
import { getAssetData } from '../assetData';
import { Asset, AssetPair } from '../../src/index';

let asset1: Asset;
let asset2: Asset;

describe('AssetPair', () => {
  beforeEach(() => {
    asset1 = new Asset(
      getAssetData({
        id: 'test1',
        name: 'Test No. 1',
        precision: 0,
        reissuable: false,
      }),
    );

    asset2 = new Asset(
      getAssetData({
        ticker: 'TN2',
        id: 'test2',
        name: 'Test No. 2',
        precision: 4,
        reissuable: true,
      }),
    );
  });

  describe('creating instances', () => {
    it('should be an instance of AssetPair', () => {
      const assetPair = new AssetPair(asset1, asset2);
      expect(AssetPair.isAssetPair(assetPair)).toBe(true);
    });

    it('should calculate precision difference', () => {
      const assetPair = new AssetPair(asset1, asset2);
      expect(assetPair.precisionDifference).toBe(4);
    });

    it('should handle zero precision difference', () => {
      const samePrec = new Asset(getAssetData({ id: 'same', precision: 4 }));
      const pair = new AssetPair(samePrec, asset2);
      expect(pair.precisionDifference).toBe(0);
    });

    it('should handle negative precision difference', () => {
      const pair = new AssetPair(asset2, asset1); // 0 - 4 = -4
      expect(pair.precisionDifference).toBe(-4);
    });
  });

  describe('type guard', () => {
    it('should reject non-AssetPair objects', () => {
      expect(AssetPair.isAssetPair({})).toBe(false);
      expect(AssetPair.isAssetPair({ amountAsset: asset1, priceAsset: asset2 })).toBe(false);
    });
  });

  describe('conversions', () => {
    it('should convert to a string', () => {
      const assetPair = new AssetPair(asset1, asset2);
      expect(assetPair.toString()).toBe(`${asset1.id}/${asset2.id}`);
    });

    it('should serialize to JSON', () => {
      const assetPair = new AssetPair(asset1, asset2);
      const json = assetPair.toJSON();
      expect(json.amountAsset).toBe('test1');
      expect(json.priceAsset).toBe('test2');
    });
  });
});
