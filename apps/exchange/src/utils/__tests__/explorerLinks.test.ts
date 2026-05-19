/**
 * Unit tests: src/utils/explorerLinks.ts
 *
 * Tests URL generation, validation, open helpers, and clipboard utilities.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  copyToClipboard,
  explorerLinks,
  explorerUtils,
  getExplorerLinks,
  getShortAddress,
  getShortTxId,
  isValidAddress,
  isValidAssetId,
  isValidTxId,
  mainnetExplorer,
  openAddress,
  openAsset,
  openBlock,
  openInExplorer,
  openTransaction,
  parseExplorerUrl,
  stagenetExplorer,
  testnetExplorer,
} from '@/utils/explorerLinks';

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// ─── getExplorerLinks ─────────────────────────────────────────────────────────

describe('getExplorerLinks', () => {
  it('defaults to mainnet when called with no argument', () => {
    const links = getExplorerLinks();
    expect(links.getBaseUrl()).toBe('https://decentralscan.com');
  });

  it('resolves mainnet base URL via string shorthand', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.getBaseUrl()).toBe('https://decentralscan.com');
  });

  it('resolves testnet base URL', () => {
    const links = getExplorerLinks('testnet');
    expect(links.getBaseUrl()).toBe('https://testnet.decentralscan.com');
  });

  it('resolves stagenet base URL', () => {
    const links = getExplorerLinks('stagenet');
    expect(links.getBaseUrl()).toBe('https://stagenet.decentralscan.com');
  });

  it('uses customBaseUrl for custom networks', () => {
    const links = getExplorerLinks({ customBaseUrl: 'https://my.explorer', network: 'custom' });
    expect(links.getBaseUrl()).toBe('https://my.explorer');
  });

  it('falls back to mainnet when custom network has no customBaseUrl', () => {
    const links = getExplorerLinks({ network: 'custom' });
    expect(links.getBaseUrl()).toBe('https://decentralscan.com');
  });

  it('accepts an ExplorerConfig object with a named network', () => {
    const links = getExplorerLinks({ network: 'testnet' });
    expect(links.getBaseUrl()).toBe('https://testnet.decentralscan.com');
  });

  // ── URL generators ──────────────────────────────────────────────────────

  it('builds a transaction URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.transaction('TXID123')).toBe('https://decentralscan.com/tx/TXID123');
  });

  it('builds an address URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.address('3P1234')).toBe('https://decentralscan.com/address/3P1234');
  });

  it('builds a block URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.block(999)).toBe('https://decentralscan.com/blocks/999');
  });

  it('builds an asset URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.asset('ASSET_ID')).toBe('https://decentralscan.com/assets/ASSET_ID');
  });

  it('builds an alias URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.alias('myalias')).toBe('https://decentralscan.com/alias/myalias');
  });

  it('strips the alias: prefix from aliases', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.alias('alias:myalias')).toBe('https://decentralscan.com/alias/myalias');
  });

  it('builds a data URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.data('3P1234')).toBe('https://decentralscan.com/address/3P1234/data');
  });

  it('builds a leasing URL', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.leasing('3P1234')).toBe('https://decentralscan.com/address/3P1234/leasing');
  });

  // ── empty / invalid inputs fall back to baseUrl ─────────────────────────

  it('returns baseUrl for empty txId', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.transaction('')).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for empty address', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.address('')).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for negative block height', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.block(-1)).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for empty assetId', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.asset('')).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for empty alias', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.alias('')).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for empty data address', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.data('')).toBe('https://decentralscan.com');
  });

  it('returns baseUrl for empty leasing address', () => {
    const links = getExplorerLinks('mainnet');
    expect(links.leasing('')).toBe('https://decentralscan.com');
  });
});

// ─── pre-built singletons ─────────────────────────────────────────────────────

describe('pre-built explorer singletons', () => {
  it('explorerLinks points to mainnet', () => {
    expect(explorerLinks.getBaseUrl()).toBe('https://decentralscan.com');
  });

  it('mainnetExplorer points to mainnet', () => {
    expect(mainnetExplorer.getBaseUrl()).toBe('https://decentralscan.com');
  });

  it('testnetExplorer points to testnet', () => {
    expect(testnetExplorer.getBaseUrl()).toBe('https://testnet.decentralscan.com');
  });

  it('stagenetExplorer points to stagenet', () => {
    expect(stagenetExplorer.getBaseUrl()).toBe('https://stagenet.decentralscan.com');
  });
});

// ─── openInExplorer / open* helpers ──────────────────────────────────────────

describe('openInExplorer', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('calls window.open with the provided URL', () => {
    openInExplorer('https://decentralscan.com/tx/abc');
    expect(openSpy).toHaveBeenCalledWith(
      'https://decentralscan.com/tx/abc',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('does nothing for an empty URL', () => {
    openInExplorer('');
    expect(openSpy).not.toHaveBeenCalled();
  });
});

describe('openTransaction', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens a mainnet transaction URL by default', () => {
    openTransaction('TXID123');
    expect(openSpy).toHaveBeenCalledWith(
      'https://decentralscan.com/tx/TXID123',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens a testnet transaction URL when specified', () => {
    openTransaction('TXID123', 'testnet');
    expect(openSpy).toHaveBeenCalledWith(
      'https://testnet.decentralscan.com/tx/TXID123',
      '_blank',
      'noopener,noreferrer',
    );
  });
});

describe('openAddress', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens a mainnet address URL', () => {
    openAddress('3P1234');
    expect(openSpy).toHaveBeenCalledWith(
      'https://decentralscan.com/address/3P1234',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens a stagenet address URL when specified', () => {
    openAddress('3P1234', 'stagenet');
    expect(openSpy).toHaveBeenCalledWith(
      'https://stagenet.decentralscan.com/address/3P1234',
      '_blank',
      'noopener,noreferrer',
    );
  });
});

describe('openBlock', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens a block URL', () => {
    openBlock(1500);
    expect(openSpy).toHaveBeenCalledWith(
      'https://decentralscan.com/blocks/1500',
      '_blank',
      'noopener,noreferrer',
    );
  });
});

describe('openAsset', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens an asset URL', () => {
    openAsset('DCC');
    expect(openSpy).toHaveBeenCalledWith(
      'https://decentralscan.com/assets/DCC',
      '_blank',
      'noopener,noreferrer',
    );
  });
});

// ─── validators ───────────────────────────────────────────────────────────────

describe('isValidTxId', () => {
  it('returns true for a valid 44-char base58 transaction ID', () => {
    // '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK' is the BTC asset ID — 44 chars, valid base58
    expect(isValidTxId('25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidTxId('')).toBe(false);
  });

  it('returns false for a string shorter than 44 chars', () => {
    expect(isValidTxId('TXID123')).toBe(false);
  });

  it('returns false for a string with invalid base58 chars (0, O, I, l)', () => {
    expect(isValidTxId('0BCDEF1234567890abcdef1234567890abcdef12345')).toBe(false);
  });
});

describe('isValidAddress', () => {
  it('returns true for a valid DCC address starting with 3', () => {
    expect(isValidAddress('3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidAddress('')).toBe(false);
  });

  it('returns false for an address not starting with 3', () => {
    expect(isValidAddress('1PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK')).toBe(false);
  });

  it('returns false for an address that is too short', () => {
    expect(isValidAddress('3Pabc')).toBe(false);
  });
});

describe('isValidAssetId', () => {
  it('returns true for the native DCC token', () => {
    expect(isValidAssetId('DCC')).toBe(true);
  });

  it('returns true for a valid 44-char base58 asset ID', () => {
    expect(isValidAssetId('25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidAssetId('')).toBe(false);
  });

  it('returns false for a string containing invalid base58 chars', () => {
    expect(isValidAssetId('000000000000000000000000000000000000000000000')).toBe(false);
  });
});

// ─── parseExplorerUrl ────────────────────────────────────────────────────────

describe('parseExplorerUrl', () => {
  it('parses a mainnet transaction URL', () => {
    const result = parseExplorerUrl('https://decentralscan.com/tx/TXID123');
    expect(result).toEqual({ id: 'TXID123', network: 'mainnet', type: 'tx' });
  });

  it('detects testnet network', () => {
    const result = parseExplorerUrl('https://testnet.decentralscan.com/address/3P1234');
    expect(result).toEqual({ id: '3P1234', network: 'testnet', type: 'address' });
  });

  it('detects stagenet network', () => {
    const result = parseExplorerUrl('https://stagenet.decentralscan.com/blocks/100');
    expect(result).toEqual({ id: '100', network: 'stagenet', type: 'blocks' });
  });

  it('returns null for a URL with no path segments', () => {
    expect(parseExplorerUrl('https://decentralscan.com/')).toBeNull();
  });

  it('returns null for a URL with only one path segment', () => {
    expect(parseExplorerUrl('https://decentralscan.com/tx')).toBeNull();
  });

  it('returns null for an invalid URL', () => {
    expect(parseExplorerUrl('not-a-url')).toBeNull();
  });
});

// ─── getShortTxId / getShortAddress ──────────────────────────────────────────

describe('getShortTxId', () => {
  it('returns the ID unchanged when shorter than 10 chars', () => {
    expect(getShortTxId('short')).toBe('short');
  });

  it('shortens a long ID to first 6 + ... + last 4', () => {
    // '6oLCBGcRzCiXxpkWrKQH2Yv8JBCqE2pNDnfwCZqA9mS' (44 chars)
    const id = '6oLCBGcRzCiXxpkWrKQH2Yv8JBCqE2pNDnfwCZqA9mS';
    expect(getShortTxId(id)).toBe('6oLCBG...A9mS');
  });

  it('returns an empty string unchanged', () => {
    expect(getShortTxId('')).toBe('');
  });
});

describe('getShortAddress', () => {
  it('returns the address unchanged when shorter than 10 chars', () => {
    expect(getShortAddress('3P1234')).toBe('3P1234');
  });

  it('shortens a 35-char address to first 6 + ... + last 4', () => {
    const addr = '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK';
    expect(getShortAddress(addr)).toBe('3PJCkx...KvqK');
  });
});

// ─── copyToClipboard ─────────────────────────────────────────────────────────

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when navigator.clipboard.writeText succeeds', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockWriteText },
    });

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('hello');
  });

  it('returns false when navigator.clipboard.writeText rejects', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockWriteText },
    });

    const result = await copyToClipboard('hello');
    expect(result).toBe(false);
  });

  it('uses execCommand fallback when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    // jsdom does not define execCommand — define it before testing
    const mockExecCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: mockExecCommand,
      writable: true,
    });

    const result = await copyToClipboard('fallback text');
    expect(result).toBe(true);
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
  });
});

// ─── explorerUtils namespace ──────────────────────────────────────────────────

describe('explorerUtils', () => {
  it('exposes all expected utility functions', () => {
    expect(explorerUtils.copyToClipboard).toBe(copyToClipboard);
    expect(explorerUtils.getExplorerLinks).toBe(getExplorerLinks);
    expect(explorerUtils.getShortAddress).toBe(getShortAddress);
    expect(explorerUtils.getShortTxId).toBe(getShortTxId);
    expect(explorerUtils.isValidAddress).toBe(isValidAddress);
    expect(explorerUtils.isValidAssetId).toBe(isValidAssetId);
    expect(explorerUtils.isValidTxId).toBe(isValidTxId);
    expect(explorerUtils.openAddress).toBe(openAddress);
    expect(explorerUtils.openAsset).toBe(openAsset);
    expect(explorerUtils.openBlock).toBe(openBlock);
    expect(explorerUtils.openInExplorer).toBe(openInExplorer);
    expect(explorerUtils.openTransaction).toBe(openTransaction);
    expect(explorerUtils.parseExplorerUrl).toBe(parseExplorerUrl);
  });
});
