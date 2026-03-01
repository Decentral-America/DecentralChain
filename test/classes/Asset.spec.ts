import { describe, it, expect, beforeEach } from 'vitest';
import { getAssetData } from '../assetData';
import { Asset } from '../../src/index';
import { type IAssetInfo } from '../../src/entities/Asset';

let defaultAssetInfo1: IAssetInfo;
let defaultAssetInfo2: IAssetInfo;

describe('Asset', () => {
  beforeEach(() => {
    defaultAssetInfo1 = getAssetData({
      id: 'test1',
      name: 'Test No. 1',
      precision: 0,
      reissuable: false,
      hasScript: true,
      minSponsoredFee: 100000,
    });

    defaultAssetInfo2 = getAssetData({
      ticker: 'TN2',
      id: 'test2',
      name: 'Test No. 2',
      precision: 8,
      reissuable: true,
      hasScript: false,
      minSponsoredFee: 1,
    });
  });

  describe('creating instances', () => {
    it('should be an instance of Asset #1', () => {
      const asset = new Asset(defaultAssetInfo1);
      expect(Asset.isAsset(asset)).toBe(true);
    });

    it('should be an instance of Asset #2', () => {
      const asset = new Asset(defaultAssetInfo2);
      expect(Asset.isAsset(asset)).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const info = getAssetData({ id: 'no-ticker' });
      const asset = new Asset(info);
      expect(asset.ticker).toBeNull();
      expect(asset.hasScript).toBe(true);
      expect(asset.displayName).toBe('Default Name');
    });

    it('should use ticker as displayName when available', () => {
      const asset = new Asset(defaultAssetInfo2);
      expect(asset.displayName).toBe('TN2');
    });

    it('should handle missing minSponsoredFee', () => {
      const info = getAssetData({ minSponsoredFee: undefined });
      const asset = new Asset(info);
      expect(asset.minSponsoredFee).toBeNull();
    });
  });

  describe('conversions', () => {
    it('should convert to a string #1', () => {
      const asset = new Asset(defaultAssetInfo1);
      expect(asset.toString()).toBe(defaultAssetInfo1.id);
    });

    it('should convert to a string #2', () => {
      const asset = new Asset(defaultAssetInfo2);
      expect(asset.toString()).toBe(defaultAssetInfo2.id);
    });

    it('should serialize to JSON', () => {
      const asset = new Asset(defaultAssetInfo1);
      const json = asset.toJSON();
      expect(json.id).toBe('test1');
      expect(json.name).toBe('Test No. 1');
      expect(json.precision).toBe(0);
      expect(json.reissuable).toBe(false);
      expect(json.hasScript).toBe(true);
    });
  });
});
