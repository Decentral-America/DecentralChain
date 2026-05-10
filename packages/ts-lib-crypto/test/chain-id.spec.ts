import { describe, expect, test } from 'vitest';
import { ChainId, MAIN_NET_CHAIN_ID, TEST_NET_CHAIN_ID } from '../src';

describe('ChainId', () => {
  describe('toNumber', () => {
    test('converts string chain ID to char code', () => {
      expect(ChainId.toNumber('?')).toBe(63);
      expect(ChainId.toNumber('!')).toBe(33);
      expect(ChainId.toNumber('W')).toBe(87);
    });

    test('returns numeric chain ID as-is', () => {
      expect(ChainId.toNumber(63)).toBe(63);
      expect(ChainId.toNumber(33)).toBe(33);
      expect(ChainId.toNumber(0)).toBe(0);
    });
  });

  describe('isMainnet', () => {
    test('returns true for mainnet chain ID string', () => {
      expect(ChainId.isMainnet('?')).toBe(true);
    });

    test('returns true for mainnet chain ID number', () => {
      expect(ChainId.isMainnet(MAIN_NET_CHAIN_ID)).toBe(true);
    });

    test('returns false for non-mainnet', () => {
      expect(ChainId.isMainnet('!')).toBe(false);
      expect(ChainId.isMainnet('W')).toBe(false);
      expect(ChainId.isMainnet(0)).toBe(false);
    });
  });

  describe('isTestnet', () => {
    test('returns true for testnet chain ID string', () => {
      expect(ChainId.isTestnet('!')).toBe(true);
    });

    test('returns true for testnet chain ID number', () => {
      expect(ChainId.isTestnet(TEST_NET_CHAIN_ID)).toBe(true);
    });

    test('returns false for non-testnet', () => {
      expect(ChainId.isTestnet('?')).toBe(false);
      expect(ChainId.isTestnet('W')).toBe(false);
      expect(ChainId.isTestnet(0)).toBe(false);
    });
  });
});
