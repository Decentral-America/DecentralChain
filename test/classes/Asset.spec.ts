import { describe, it, expect, beforeEach } from 'vitest';
import { getAssetData } from '../assetData';
import { Asset, config } from '../../src/index';
import { type IAssetInfo } from '../../src/entities/Asset';
import { BigNumber } from '@decentralchain/bignumber';

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

    it('should default hasScript to false when undefined', () => {
      const info = getAssetData({ hasScript: undefined });
      const asset = new Asset(info);
      expect(asset.hasScript).toBe(false);
    });

    it('should convert quantity to BigNumber', () => {
      const asset = new Asset(getAssetData({ quantity: '99999999999999' }));
      expect(asset.quantity).toBeInstanceOf(BigNumber);
      expect(asset.quantity.toFixed(0)).toBe('99999999999999');
    });

    it('should convert minSponsoredFee to BigNumber when provided', () => {
      const asset = new Asset(getAssetData({ minSponsoredFee: 500 }));
      expect(asset.minSponsoredFee).toBeInstanceOf(BigNumber);
      expect(asset.minSponsoredFee!.toFixed(0)).toBe('500');
    });
  });

  describe('type guard', () => {
    it('should reject non-Asset objects', () => {
      expect(Asset.isAsset({})).toBe(false);
      expect(Asset.isAsset({ id: 'fake' })).toBe(false);
    });
  });

  describe('config integration', () => {
    it('should apply remapAsset config', () => {
      const original = config.get('remapAsset');
      try {
        config.set('remapAsset', (asset) => ({ ...asset, name: 'REMAPPED' }));
        const asset = new Asset(getAssetData({ id: 'remap-test' }));
        expect(asset.name).toBe('REMAPPED');
      } finally {
        config.set('remapAsset', original);
      }
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
