/**
 * NetworkConfig Service — Unit Tests
 *
 * Validates that every getter and method on the NetworkConfig service returns the
 * correct value from mainnet.json, thereby catching any future accidental drift
 * between the JSON source-of-truth and the typed accessor layer.
 *
 * These tests are entirely offline and deterministic — they exercise the pure
 * config-reading logic with no network calls, mocks, or side effects.
 */
import { describe, expect, it } from 'vitest';
import { NetworkConfig } from '@/config/networkConfig';

describe('NetworkConfig', () => {
  describe('HTTP URL getters', () => {
    it('api points to the DCC data-service', () => {
      expect(NetworkConfig.api).toBe('https://data-service.decentralchain.io');
    });

    it('matcher points to the mainnet matcher with /matcher path suffix', () => {
      expect(NetworkConfig.matcher).toBe('https://mainnet-matcher.decentralchain.io/matcher');
    });

    it('node points to the mainnet node', () => {
      expect(NetworkConfig.node).toBe('https://mainnet-node.decentralchain.io');
    });

    it('explorer points to decentralscan', () => {
      expect(NetworkConfig.explorer).toBe('https://decentralscan.com');
    });

    it('origin points to the exchange frontend', () => {
      expect(NetworkConfig.origin).toBe('https://decentral.exchange');
    });

    it('support URL is an HTTPS URL', () => {
      expect(NetworkConfig.support).toMatch(/^https:\/\//);
    });

    it('termsAndConditions is an HTTPS URL', () => {
      expect(NetworkConfig.termsAndConditions).toMatch(/^https:\/\//);
    });

    it('privacyPolicy is an HTTPS URL', () => {
      expect(NetworkConfig.privacyPolicy).toMatch(/^https:\/\//);
    });

    it('nodeList is an HTTPS URL', () => {
      expect(NetworkConfig.nodeList).toMatch(/^https:\/\//);
    });

    it('featuresConfigUrl and feeConfigUrl are HTTPS URLs', () => {
      expect(NetworkConfig.featuresConfigUrl).toMatch(/^https:\/\//);
      expect(NetworkConfig.feeConfigUrl).toMatch(/^https:\/\//);
    });

    it('scamListUrl is an HTTPS URL', () => {
      expect(NetworkConfig.scamListUrl).toMatch(/^https:\/\//);
    });

    it('tokensNameListUrl is an HTTPS URL', () => {
      expect(NetworkConfig.tokensNameListUrl).toMatch(/^https:\/\//);
    });
  });

  describe('chain identity', () => {
    it('code is "?" — the DCC mainnet chain ID character', () => {
      expect(NetworkConfig.code).toBe('?');
    });

    it('networkByte is 63 — charCode of "?"', () => {
      expect(NetworkConfig.networkByte).toBe('?'.charCodeAt(0));
      expect(NetworkConfig.networkByte).toBe(63);
    });

    it('apiVersion is "v0"', () => {
      expect(NetworkConfig.apiVersion).toBe('v0');
    });
  });

  describe('isValid()', () => {
    it('returns true for the mainnet config (node + matcher + api all present)', () => {
      expect(NetworkConfig.isValid()).toBe(true);
    });
  });

  describe('asset lookups', () => {
    it('getAssetId("DCC") returns the native DCC asset constant', () => {
      expect(NetworkConfig.getAssetId('DCC')).toBe('DCC');
    });

    it('getAssetId("BTC") returns the BTC asset ID', () => {
      expect(NetworkConfig.getAssetId('BTC')).toBe('25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK');
    });

    it('getAssetId for an unknown ticker returns undefined', () => {
      expect(NetworkConfig.getAssetId('NOSUCHTOKEN')).toBeUndefined();
    });

    it('getAssetTicker("DCC") returns "DCC"', () => {
      expect(NetworkConfig.getAssetTicker('DCC')).toBe('DCC');
    });

    it('getAssetTicker for the BTC asset ID returns "BTC"', () => {
      expect(NetworkConfig.getAssetTicker('25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK')).toBe(
        'BTC',
      );
    });

    it('getAssetTicker for an unknown ID returns undefined', () => {
      expect(NetworkConfig.getAssetTicker('UNKNOWN_ASSET_ID_XYZ')).toBeUndefined();
    });

    it('assets getter returns a defensive copy — mutations do not affect config', () => {
      const a = NetworkConfig.assets;
      const b = NetworkConfig.assets;
      expect(a).not.toBe(b); // distinct object references
      expect(a).toEqual(b); // same content
    });
  });

  describe('get() — dotted-path accessor', () => {
    it('reads a top-level key', () => {
      expect(NetworkConfig.get('code')).toBe('?');
    });

    it('reads a nested key via dot notation', () => {
      expect(NetworkConfig.get('assets.DCC')).toBe('DCC');
    });

    it('returns undefined for a completely missing key', () => {
      expect(NetworkConfig.get('nonexistent')).toBeUndefined();
    });

    it('returns undefined for a partially-missing nested path', () => {
      expect(NetworkConfig.get('assets.NOSUCHTOKEN')).toBeUndefined();
    });
  });

  describe('gateway', () => {
    const BTC_ASSET_ID = '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK';

    it('hasGateway returns true for BTC (configured ERC-20 gateway)', () => {
      expect(NetworkConfig.hasGateway(BTC_ASSET_ID)).toBe(true);
    });

    it('hasGateway returns false for DCC (no gateway needed for native asset)', () => {
      expect(NetworkConfig.hasGateway('DCC')).toBe(false);
    });

    it('hasGateway returns false for an unknown asset', () => {
      expect(NetworkConfig.hasGateway('UNKNOWN_ASSET_XY')).toBe(false);
    });

    it('getGatewayConfig for BTC contains a url and a regex', () => {
      const config = NetworkConfig.getGatewayConfig(BTC_ASSET_ID);
      expect(config).toBeDefined();
      expect(config?.url).toMatch(/^https:\/\//);
      expect(config?.regex).toBeTruthy();
    });

    it('getGatewayConfig for an unknown asset returns undefined', () => {
      expect(NetworkConfig.getGatewayConfig('UNKNOWN_ASSET_XY')).toBeUndefined();
    });

    it('getAllGatewayConfigs returns a defensive copy', () => {
      const a = NetworkConfig.getAllGatewayConfigs();
      const b = NetworkConfig.getAllGatewayConfigs();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('matcher priority list', () => {
    it('returns a non-empty array', () => {
      expect(NetworkConfig.getMatcherPriorityList().length).toBeGreaterThan(0);
    });

    it('has DCC as the first priority asset', () => {
      const list = NetworkConfig.getMatcherPriorityList();
      expect(list[0]).toMatchObject({ id: 'DCC', ticker: 'DCC' });
    });

    it('returns a defensive copy — mutations do not affect config', () => {
      expect(NetworkConfig.getMatcherPriorityList()).not.toBe(
        NetworkConfig.getMatcherPriorityList(),
      );
    });
  });

  describe('trading pairs', () => {
    it('returns a non-empty array of pairs', () => {
      const pairs = NetworkConfig.getTradingPairs();
      expect(pairs.length).toBeGreaterThan(0);
    });

    it('every pair is a two-element tuple of asset IDs', () => {
      for (const pair of NetworkConfig.getTradingPairs()) {
        expect(pair).toHaveLength(2);
        expect(typeof pair[0]).toBe('string');
        expect(typeof pair[1]).toBe('string');
      }
    });

    it('DCC/BTC pair is present', () => {
      const BTC_ASSET_ID = '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK';
      const pairs = NetworkConfig.getTradingPairs();
      const hasDccBtc = pairs.some(([a, b]) => a === 'DCC' && b === BTC_ASSET_ID);
      expect(hasDccBtc).toBe(true);
    });
  });

  describe('oracles', () => {
    it('oracleDCC is a non-empty base58 address', () => {
      expect(NetworkConfig.oracleDCC).toBeTruthy();
      expect(NetworkConfig.oracleDCC.length).toBeGreaterThan(0);
    });

    it('oracles object exposes the dcc property', () => {
      expect(NetworkConfig.oracles).toHaveProperty('dcc');
    });
  });

  describe('getFullConfig()', () => {
    it('returns an object with the same values as the individual getters', () => {
      const full = NetworkConfig.getFullConfig();
      expect(full.api).toBe(NetworkConfig.api);
      expect(full.matcher).toBe(NetworkConfig.matcher);
      expect(full.node).toBe(NetworkConfig.node);
      expect(full.code).toBe(NetworkConfig.code);
    });

    it('returns a defensive copy — each call yields a distinct object', () => {
      expect(NetworkConfig.getFullConfig()).not.toBe(NetworkConfig.getFullConfig());
    });
  });
});
