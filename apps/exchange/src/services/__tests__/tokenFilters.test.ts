/**
 * Unit tests: src/services/tokenFilters.ts
 *
 * TokenFilterService — pure class logic, no DOM/network.
 * The singleton is seeded with static mainnet data.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Suppress logger output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// vi.mock is hoisted automatically by Vitest — static import is safe
import tokenFilterService from '@/services/tokenFilters';

describe('TokenFilterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── isInitialized ────────────────────────────────────────────────────────

  describe('isInitialized', () => {
    it('returns true immediately after construction', () => {
      expect(tokenFilterService.isInitialized()).toBe(true);
    });
  });

  // ── initialize ───────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('is a no-op that resolves to void', async () => {
      await expect(tokenFilterService.initialize()).resolves.toBeUndefined();
    });
  });

  // ── isScam ───────────────────────────────────────────────────────────────

  describe('isScam', () => {
    it('returns true for a known mainnet scam asset', () => {
      expect(tokenFilterService.isScam('74jKuX6unv6yQcVosoSfKbvmQmi5A4H42crnVWAZ9wh8')).toBe(true);
    });

    it('returns false for an unknown asset ID', () => {
      expect(tokenFilterService.isScam('SomeRandomAssetId')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(tokenFilterService.isScam('')).toBe(false);
    });

    it('returns false for the native DCC asset', () => {
      expect(tokenFilterService.isScam('DCC')).toBe(false);
    });
  });

  // ── getTokenInfo ─────────────────────────────────────────────────────────

  describe('getTokenInfo', () => {
    it('returns info for the DCC native asset', () => {
      const info = tokenFilterService.getTokenInfo('DCC');
      expect(info).toBeDefined();
      expect(info?.ticker).toBe('DCC');
      expect(info?.name).toBe('DecentralCoin');
      expect(info?.verified).toBe(true);
    });

    it('returns info for a known verified token', () => {
      const info = tokenFilterService.getTokenInfo('25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK');
      expect(info?.ticker).toBe('BTC');
    });

    it('returns undefined for an unknown asset', () => {
      expect(tokenFilterService.getTokenInfo('UnknownAssetId000')).toBeUndefined();
    });

    it('returns undefined for an empty string', () => {
      expect(tokenFilterService.getTokenInfo('')).toBeUndefined();
    });
  });

  // ── getDisplayName ───────────────────────────────────────────────────────

  describe('getDisplayName', () => {
    it('returns the ticker when available', () => {
      expect(tokenFilterService.getDisplayName('DCC')).toBe('DCC');
    });

    it('returns the ticker for the CRC token', () => {
      // CRC has ticker='CRC' and name='CR Coin'; ticker takes precedence
      expect(
        tokenFilterService.getDisplayName('G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo'),
      ).toBe('CRC');
    });

    it('returns the default fallback for an unknown asset', () => {
      expect(tokenFilterService.getDisplayName('UnknownXYZ')).toBe('Unknown');
    });

    it('returns a custom fallback for an unknown asset', () => {
      expect(tokenFilterService.getDisplayName('UnknownXYZ', 'N/A')).toBe('N/A');
    });

    it('returns the fallback for an empty assetId', () => {
      expect(tokenFilterService.getDisplayName('')).toBe('Unknown');
    });
  });

  // ── getVerifiedTokens ────────────────────────────────────────────────────

  describe('getVerifiedTokens', () => {
    it('returns only verified tokens', () => {
      const tokens = tokenFilterService.getVerifiedTokens();
      expect(tokens.length).toBeGreaterThan(0);
      for (const token of tokens) {
        expect(token.verified).toBe(true);
      }
    });

    it('includes the native DCC token', () => {
      const tokens = tokenFilterService.getVerifiedTokens();
      const dcc = tokens.find((t) => t.assetId === 'DCC');
      expect(dcc).toBeDefined();
    });
  });
});
