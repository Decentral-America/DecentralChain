import { describe, it, expect, afterEach } from 'vitest';
import { config, type IConfig } from '../src/index';

describe('config', () => {
  // Save originals so each test restores them
  let originalRemapAsset: IConfig['remapAsset'];
  let originalRemapCandle: IConfig['remapCandle'];

  afterEach(() => {
    // Restore defaults (identity functions)
    if (originalRemapAsset) config.set('remapAsset', originalRemapAsset);
    if (originalRemapCandle) config.set('remapCandle', originalRemapCandle);
  });

  describe('get', () => {
    it('should return default remapAsset (identity function)', () => {
      const remap = config.get('remapAsset');
      expect(typeof remap).toBe('function');
      const dummy = { id: 'test' } as Parameters<IConfig['remapAsset']>[0];
      expect(remap(dummy)).toBe(dummy);
    });

    it('should return default remapCandle (identity function)', () => {
      const remap = config.get('remapCandle');
      expect(typeof remap).toBe('function');
      const dummy = { time: new Date() } as Parameters<IConfig['remapCandle']>[0];
      expect(remap(dummy)).toBe(dummy);
    });
  });

  describe('set with key-value pair', () => {
    it('should set remapAsset by key', () => {
      originalRemapAsset = config.get('remapAsset');
      const custom = (asset: Parameters<IConfig['remapAsset']>[0]) => ({
        ...asset,
        name: 'REMAPPED',
      });
      config.set('remapAsset', custom);
      expect(config.get('remapAsset')).toBe(custom);
    });

    it('should set remapCandle by key', () => {
      originalRemapCandle = config.get('remapCandle');
      const custom = (candle: Parameters<IConfig['remapCandle']>[0]) => ({
        ...candle,
        txsCount: 999,
      });
      config.set('remapCandle', custom);
      expect(config.get('remapCandle')).toBe(custom);
    });
  });

  describe('set with object', () => {
    it('should set multiple values at once', () => {
      originalRemapAsset = config.get('remapAsset');
      originalRemapCandle = config.get('remapCandle');

      const customAsset = (asset: Parameters<IConfig['remapAsset']>[0]) => ({
        ...asset,
        name: 'BULK',
      });
      const customCandle = (candle: Parameters<IConfig['remapCandle']>[0]) => ({
        ...candle,
        txsCount: 0,
      });

      config.set({ remapAsset: customAsset, remapCandle: customCandle });
      expect(config.get('remapAsset')).toBe(customAsset);
      expect(config.get('remapCandle')).toBe(customCandle);
    });

    it('should allow partial object (only set one key)', () => {
      originalRemapAsset = config.get('remapAsset');
      const custom = (asset: Parameters<IConfig['remapAsset']>[0]) => ({
        ...asset,
        name: 'PARTIAL',
      });
      config.set({ remapAsset: custom });
      expect(config.get('remapAsset')).toBe(custom);
    });
  });

  describe('set with undefined value (key-value form)', () => {
    it('should not mutate config when value is undefined', () => {
      const before = config.get('remapAsset');
      // @ts-expect-error -- testing runtime guard for undefined
      config.set('remapAsset', undefined);
      expect(config.get('remapAsset')).toBe(before);
    });
  });
});
