import { describe, expect, it } from 'vitest';
import { NAME_MAP, TRANSACTION_STATUSES } from '../../src/constants';

describe('constants – transaction name map', () => {
  it('maps all expected transaction type names to numeric codes', () => {
    expect(NAME_MAP.issue).toBe(3);
    expect(NAME_MAP.transfer).toBe(4);
    expect(NAME_MAP.reissue).toBe(5);
    expect(NAME_MAP.burn).toBe(6);
    expect(NAME_MAP.exchange).toBe(7);
    expect(NAME_MAP.lease).toBe(8);
    expect(NAME_MAP.cancelLease).toBe(9);
    expect(NAME_MAP.alias).toBe(10);
    expect(NAME_MAP.massTransfer).toBe(11);
    expect(NAME_MAP.data).toBe(12);
    expect(NAME_MAP.setScript).toBe(13);
    expect(NAME_MAP.sponsorship).toBe(14);
    expect(NAME_MAP.setAssetScript).toBe(15);
    expect(NAME_MAP.invoke).toBe(16);
    expect(NAME_MAP.updateAsset).toBe(17);
  });

  it('has unique numeric codes for every transaction type', () => {
    const values = Object.values(NAME_MAP);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('constants – transaction statuses', () => {
  it('defines all expected lifecycle statuses', () => {
    expect(TRANSACTION_STATUSES.IN_BLOCKCHAIN).toBe('in_blockchain');
    expect(TRANSACTION_STATUSES.UNCONFIRMED).toBe('unconfirmed');
    expect(TRANSACTION_STATUSES.NOT_FOUND).toBe('not_found');
  });

  it('has exactly 3 statuses', () => {
    expect(Object.keys(TRANSACTION_STATUSES)).toHaveLength(3);
  });
});
