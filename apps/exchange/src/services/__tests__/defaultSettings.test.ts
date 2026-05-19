/**
 * Unit tests: src/services/defaultSettings.ts
 *
 * Tests the DefaultSettings class, its factory helpers, and localStorage persistence.
 * jsdom provides a working localStorage implementation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/config/networkConfig', () => ({
  NetworkConfig: {
    api: 'https://api.decentralscan.com',
    apiVersion: '/v1',
    assets: {},
    code: '?',
    explorer: 'https://decentralscan.com',
    gateway: {},
    matcher: 'https://matcher.decentralscan.com',
    networkByte: 87,
    node: 'https://nodes.decentralscan.com',
    nodeList: 'https://nodes.decentralscan.com',
    oracleDCC: '3P7oZmR3Esc5WRifKJKMTqkb6YRqS2HN8ow',
    oracles: {},
    oracleTokenomica: '',
    origin: 'https://decentralscan.com',
    privacyPolicy: '',
    support: '',
    termsAndConditions: '',
    tradingPairs: [],
  },
}));

import { logger } from '@/lib/logger';
import {
  createDefaultSettings,
  DefaultSettings,
  getDefaultSettings,
} from '@/services/defaultSettings';

describe('DefaultSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── constructor & defaults ───────────────────────────────────────────────

  describe('constructor defaults', () => {
    it('returns the default language', () => {
      const s = new DefaultSettings();
      expect(s.get('lng')).toBe('en');
    });

    it('returns the default theme', () => {
      const s = new DefaultSettings();
      expect(s.get('theme')).toBe('default');
    });

    it('returns the default logoutAfterMin', () => {
      const s = new DefaultSettings();
      expect(s.get<number>('logoutAfterMin')).toBe(5);
    });

    it('returns the default baseAssetId', () => {
      const s = new DefaultSettings();
      expect(s.get('baseAssetId')).toBe('DCC');
    });

    it('returns the default network from mocked NetworkConfig', () => {
      const s = new DefaultSettings();
      expect(s.get('network')).toBe('?');
    });

    it('returns the default encryptionRounds', () => {
      const s = new DefaultSettings();
      expect(s.get<number>('encryptionRounds')).toBe(5000);
    });

    it('returns the default pinnedAssetIdList', () => {
      const s = new DefaultSettings();
      expect(s.get<string[]>('pinnedAssetIdList')).toEqual(['DCC', 'CRC']);
    });

    it('returns the default DEX chart crop rate', () => {
      const s = new DefaultSettings();
      expect(s.get<number>('dex.chartCropRate')).toBe(1.5);
    });

    it('returns a nested user setting via dot notation', () => {
      const s = new DefaultSettings();
      expect(s.get<string>('wallet.activeState')).toBe('assets');
    });

    it('returns a deeply nested setting', () => {
      const s = new DefaultSettings();
      expect(s.get<string>('dex.assetIdPair.amount')).toBe('DCC');
    });
  });

  // ── set ──────────────────────────────────────────────────────────────────

  describe('set', () => {
    it('overrides a common setting', () => {
      const s = new DefaultSettings();
      s.set('lng', 'fr');
      expect(s.get('lng')).toBe('fr');
    });

    it('overrides a user setting', () => {
      const s = new DefaultSettings();
      s.set('encryptionRounds', 10_000);
      expect(s.get<number>('encryptionRounds')).toBe(10_000);
    });

    it('removes a common setting when value matches default', () => {
      const s = new DefaultSettings();
      s.set('lng', 'fr');
      expect(s.get('lng')).toBe('fr');
      // Reset to default — should be removed from stored overrides
      s.set('lng', 'en');
      expect(s.getSettings().common['lng']).toBeUndefined();
      // But get() still returns 'en' from commonDefaults
      expect(s.get('lng')).toBe('en');
    });

    it('removes a user setting when value matches default', () => {
      const s = new DefaultSettings();
      s.set('encryptionRounds', 5000);
      expect(s.getSettings().settings['encryptionRounds']).toBeUndefined();
      expect(s.get<number>('encryptionRounds')).toBe(5000);
    });

    it('persists a change to localStorage', () => {
      const s = new DefaultSettings();
      s.set('lng', 'de');
      const stored = localStorage.getItem('commonSettings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored ?? '{}') as Record<string, unknown>;
      expect(parsed['lng']).toBe('de');
    });

    it('persists a user setting to localStorage', () => {
      const s = new DefaultSettings();
      s.set('encryptionRounds', 8000);
      const stored = localStorage.getItem('userSettings');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored ?? '{}') as Record<string, unknown>;
      expect(parsed['encryptionRounds']).toBe(8000);
    });
  });

  // ── setCommonSettings ────────────────────────────────────────────────────

  describe('setCommonSettings', () => {
    it('replaces the common settings object', () => {
      const s = new DefaultSettings();
      s.setCommonSettings({ lng: 'es', theme: 'black' });
      expect(s.get('lng')).toBe('es');
      expect(s.get('theme')).toBe('black');
    });

    it('persists after setCommonSettings', () => {
      const s = new DefaultSettings();
      s.setCommonSettings({ lng: 'ja' });
      const stored = localStorage.getItem('commonSettings');
      expect(JSON.parse(stored ?? '{}')).toMatchObject({ lng: 'ja' });
    });
  });

  // ── getSettings ──────────────────────────────────────────────────────────

  describe('getSettings', () => {
    it('returns an object with common and settings keys', () => {
      const s = new DefaultSettings();
      const { common, settings } = s.getSettings();
      expect(common).toBeDefined();
      expect(settings).toBeDefined();
    });

    it('common is empty when no overrides exist', () => {
      const s = new DefaultSettings();
      expect(Object.keys(s.getSettings().common)).toHaveLength(0);
    });

    it('reflects an override in common', () => {
      const s = new DefaultSettings();
      s.set('lng', 'zh');
      expect(s.getSettings().common['lng']).toBe('zh');
    });
  });

  // ── load ─────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('reads stored settings from localStorage', () => {
      localStorage.setItem('commonSettings', JSON.stringify({ lng: 'pt' }));
      const s = new DefaultSettings();
      s.load();
      expect(s.get('lng')).toBe('pt');
    });

    it('reads stored user settings from localStorage', () => {
      localStorage.setItem('userSettings', JSON.stringify({ encryptionRounds: 3000 }));
      const s = new DefaultSettings();
      s.load();
      expect(s.get<number>('encryptionRounds')).toBe(3000);
    });

    it('logs a warning and does not throw on corrupt JSON', () => {
      localStorage.setItem('commonSettings', 'not-json{{{');
      const s = new DefaultSettings();
      expect(() => s.load()).not.toThrow();
      expect(vi.mocked(logger.warn)).toHaveBeenCalled();
    });
  });
});

// ─── createDefaultSettings ───────────────────────────────────────────────────

describe('createDefaultSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a DefaultSettings instance', () => {
    const s = createDefaultSettings();
    expect(s).toBeInstanceOf(DefaultSettings);
  });

  it('loads localStorage settings on creation', () => {
    localStorage.setItem('commonSettings', JSON.stringify({ lng: 'it' }));
    const s = createDefaultSettings();
    expect(s.get('lng')).toBe('it');
  });

  it('accepts initial user settings', () => {
    const s = createDefaultSettings({ encryptionRounds: 2000 });
    expect(s.get<number>('encryptionRounds')).toBe(2000);
  });

  it('accepts initial common settings', () => {
    const s = createDefaultSettings(undefined, { lng: 'ko' });
    expect(s.get('lng')).toBe('ko');
  });
});

// ─── getDefaultSettings ──────────────────────────────────────────────────────

describe('getDefaultSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a DefaultSettings instance', () => {
    const s = getDefaultSettings();
    expect(s).toBeInstanceOf(DefaultSettings);
  });

  it('returns the same singleton instance on multiple calls', () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();
    expect(a).toBe(b);
  });
});
