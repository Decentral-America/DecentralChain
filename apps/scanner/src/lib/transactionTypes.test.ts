/**
 * Tests for transactionTypes helpers.
 *
 * Covers: TX_TYPE_NAMES lookup map integrity, txTypeName — known type,
 * unknown numeric type, null, and undefined inputs.
 */
import { describe, expect, it } from 'vitest';

import { TX_TYPE_NAMES, txTypeName } from './transactionTypes';

describe('TX_TYPE_NAMES', () => {
  it('contains entries for all documented DCC transaction types (1–18)', () => {
    for (let type = 1; type <= 18; type++) {
      expect(TX_TYPE_NAMES[type]).toBeDefined();
      expect(typeof TX_TYPE_NAMES[type]).toBe('string');
      expect(TX_TYPE_NAMES[type]?.length).toBeGreaterThan(0);
    }
  });

  it('maps well-known types to their canonical names', () => {
    expect(TX_TYPE_NAMES[4]).toBe('Transfer');
    expect(TX_TYPE_NAMES[7]).toBe('Exchange');
    expect(TX_TYPE_NAMES[16]).toBe('Invoke Script');
  });
});

describe('txTypeName', () => {
  it('returns the human-readable name for a known type', () => {
    expect(txTypeName(1)).toBe('Genesis');
    expect(txTypeName(11)).toBe('Mass Transfer');
    expect(txTypeName(18)).toBe('Ethereum');
  });

  it('returns "Type N" for an unknown numeric type', () => {
    expect(txTypeName(99)).toBe('Type 99');
    expect(txTypeName(0)).toBe('Type 0');
  });

  it('returns "Unknown" for null', () => {
    expect(txTypeName(null)).toBe('Unknown');
  });

  it('returns "Unknown" for undefined', () => {
    expect(txTypeName(undefined)).toBe('Unknown');
  });
});
