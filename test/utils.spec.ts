import { find, isEmpty, normalizeAssetId, last, TRANSACTION_TYPE } from '../src/utils';
import { DCC_ID } from '../src/prepareTx/prepare';
import { getAdapterByType, getAvailableList, adapterPriorityList, adapterList } from '../src/index';
import { AdapterType } from '../src/adapterType';
import { Adapter } from '../src/adapters/Adapter';

describe('utils', () => {
  describe('find', () => {
    it('finds matching item in list', () => {
      const list = [
        { type: 'a', val: 1 },
        { type: 'b', val: 2 },
      ];
      const result = find({ type: 'b' }, list);
      expect(result).toEqual({ type: 'b', val: 2 });
    });

    it('returns null when nothing matches', () => {
      const list = [{ type: 'a' }];
      expect(find({ type: 'z' }, list)).toBeNull();
    });

    it('returns null for empty list', () => {
      expect(find({ type: 'a' }, [])).toBeNull();
    });
  });

  describe('isEmpty', () => {
    it('returns true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns false for 0', () => {
      expect(isEmpty(0)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isEmpty('')).toBe(false);
    });

    it('returns false for false', () => {
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('normalizeAssetId', () => {
    it('returns asset ID for valid string', () => {
      expect(normalizeAssetId('someAssetId')).toBe('someAssetId');
    });

    it('returns DCC_ID for null', () => {
      expect(normalizeAssetId(null)).toBe(DCC_ID);
    });

    it('returns DCC_ID for undefined', () => {
      expect(normalizeAssetId(undefined)).toBe(DCC_ID);
    });

    it('returns DCC_ID for empty string', () => {
      expect(normalizeAssetId('')).toBe(DCC_ID);
    });
  });

  describe('last', () => {
    it('returns last element of array', () => {
      expect(last([1, 2, 3])).toBe(3);
    });

    it('returns single element', () => {
      expect(last(['only'])).toBe('only');
    });
  });

  describe('TRANSACTION_TYPE', () => {
    it('has correct type values', () => {
      expect(TRANSACTION_TYPE.TRANSFER).toBe(4);
      expect(TRANSACTION_TYPE.ISSUE).toBe(3);
      expect(TRANSACTION_TYPE.DATA).toBe(12);
      expect(TRANSACTION_TYPE.SCRIPT_INVOCATION).toBe(16);
    });
  });
});

describe('config and index exports', () => {
  beforeAll(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  describe('adapterPriorityList', () => {
    it('has correct priority order', () => {
      expect(adapterPriorityList[0]).toBe(AdapterType.CubensisConnect);
      expect(adapterPriorityList[1]).toBe(AdapterType.Ledger);
      expect(adapterPriorityList[2]).toBe(AdapterType.Seed);
      expect(adapterPriorityList[3]).toBe(AdapterType.PrivateKey);
      expect(adapterPriorityList[4]).toBe(AdapterType.Custom);
    });
  });

  describe('adapterList', () => {
    it('contains all adapters', () => {
      expect(adapterList.length).toBe(5);
    });
  });

  describe('getAdapterByType', () => {
    it('returns SeedAdapter for seed type', () => {
      const result = getAdapterByType(AdapterType.Seed);
      expect(result).toBeDefined();
    });

    it('returns null for unknown type', () => {
      const result = getAdapterByType('nonexistent' as any);
      expect(result).toBeNull();
    });
  });

  describe('getAvailableList', () => {
    it('returns an array', async () => {
      const list = await getAvailableList();
      expect(Array.isArray(list)).toBe(true);
    });
  });
});
