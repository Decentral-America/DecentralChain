/**
 * Unit tests: src/services/explorerLinks.ts  (ExplorerLinkService)
 *
 * Tests link generation, error throwing on invalid input, and open helpers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { NetworkConfig } from '@/config/networkConfig';
import { ExplorerLinkService } from '@/services/explorerLinks';

describe('ExplorerLinkService', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  // ── isConfigured ────────────────────────────────────────────────────────

  describe('isConfigured', () => {
    it('returns true when explorer URL is available', () => {
      expect(ExplorerLinkService.isConfigured()).toBe(true);
    });

    it('returns false when the explorer property throws', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(NetworkConfig, 'explorer');
      Object.defineProperty(NetworkConfig, 'explorer', {
        configurable: true,
        get: () => {
          throw new Error('no config');
        },
      });
      try {
        expect(ExplorerLinkService.isConfigured()).toBe(false);
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(NetworkConfig, 'explorer', originalDescriptor);
        }
      }
    });
  });

  // ── getAddressLink ───────────────────────────────────────────────────────

  describe('getAddressLink', () => {
    it('returns the correct address URL', () => {
      expect(ExplorerLinkService.getAddressLink('3P1234')).toBe(
        'https://decentralscan.com/address/3P1234',
      );
    });

    it('throws when address is empty', () => {
      expect(() => ExplorerLinkService.getAddressLink('')).toThrow('Address is required');
    });
  });

  // ── getAssetLink ─────────────────────────────────────────────────────────

  describe('getAssetLink', () => {
    it('returns the correct asset URL', () => {
      expect(ExplorerLinkService.getAssetLink('DCC')).toBe('https://decentralscan.com/assets/DCC');
    });

    it('throws when assetId is empty', () => {
      expect(() => ExplorerLinkService.getAssetLink('')).toThrow('Asset ID is required');
    });
  });

  // ── getBlockLink ─────────────────────────────────────────────────────────

  describe('getBlockLink', () => {
    it('returns the correct block URL', () => {
      expect(ExplorerLinkService.getBlockLink(42)).toBe('https://decentralscan.com/blocks/42');
    });

    it('throws when height is 0', () => {
      expect(() => ExplorerLinkService.getBlockLink(0)).toThrow('Valid block height is required');
    });

    it('throws when height is negative', () => {
      expect(() => ExplorerLinkService.getBlockLink(-5)).toThrow('Valid block height is required');
    });
  });

  // ── getTransactionLink ───────────────────────────────────────────────────

  describe('getTransactionLink', () => {
    it('returns the correct transaction URL', () => {
      expect(ExplorerLinkService.getTransactionLink('TXID123')).toBe(
        'https://decentralscan.com/tx/TXID123',
      );
    });

    it('throws when txId is empty', () => {
      expect(() => ExplorerLinkService.getTransactionLink('')).toThrow(
        'Transaction ID is required',
      );
    });
  });

  // ── openAddress ──────────────────────────────────────────────────────────

  describe('openAddress', () => {
    it('calls window.open with the address URL', () => {
      ExplorerLinkService.openAddress('3P1234');
      expect(openSpy).toHaveBeenCalledWith(
        'https://decentralscan.com/address/3P1234',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  // ── openAsset ────────────────────────────────────────────────────────────

  describe('openAsset', () => {
    it('calls window.open with the asset URL', () => {
      ExplorerLinkService.openAsset('DCC');
      expect(openSpy).toHaveBeenCalledWith(
        'https://decentralscan.com/assets/DCC',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  // ── openBlock ────────────────────────────────────────────────────────────

  describe('openBlock', () => {
    it('calls window.open with the block URL', () => {
      ExplorerLinkService.openBlock(100);
      expect(openSpy).toHaveBeenCalledWith(
        'https://decentralscan.com/blocks/100',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  // ── openTransaction ──────────────────────────────────────────────────────

  describe('openTransaction', () => {
    it('calls window.open with the transaction URL', () => {
      ExplorerLinkService.openTransaction('TXID123');
      expect(openSpy).toHaveBeenCalledWith(
        'https://decentralscan.com/tx/TXID123',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });
});
