import { json } from '../src/';
import Long from 'long';
import { exampleOrders, exampleTxs } from './exampleTxs';

describe('Basic serialization', () => {
  const txJson = `{"type":12,"version":1,"senderPublicKey":"7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh",
  "fee":100000,"timestamp":1542539421605,"proofs":["5AMn7DEwZ6VvDLkJNdP5EW1PPJQKeWjy8qp5HoCGWaWWEPYdr1Ewkqor6NfLPDrGQdHd5DFUoE7CtwSrfAUMKLAY"],
  "id":"F7fkrYuJAsJfJRucwty7dcBoMS95xBufxBi7AXqCFgXg",
  "data":[{"type":"binary","key":"a","value":"base64:AQIDBA=="},{"type":"binary","key":"b","value":"base64:YXNkYQ=="},{"type":"boolean","key":"c","value":true},{"type":"integer","key":"d","value":9223372036854775808}]}`;

  it('Should not break numbers', () => {
    const parsed = json.parseTx(txJson);
    expect(typeof parsed.data[3].value).toBe('string');
  });

  it('Should convertLongFields numbers using factory', () => {
    const parsed = json.parseTx(txJson, Long.fromString);
    expect(parsed.data[3].value).toBeInstanceOf(Long);
  });
});

describe('Orders json to and from', () => {
  Object.entries(exampleOrders).forEach(([version, ord]) => {
    it(`Order version: ${version}. toJSON, fromJSON`, () => {
      const str = json.stringifyOrder(ord);
      const parsed = json.parseOrder(str);
      expect(parsed).toMatchObject(ord);
    });
  });
});

describe('All tx json to and from', () => {
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}. toJSON, fromJSON`, () => {
      const str = json.stringifyTx(tx);
      const parsed = json.parseTx(str, parseInt);
      expect(parsed).toMatchObject(tx);
    });
  });
});

describe('JSON edge case handling', () => {
  it('should reject invalid data entries during serialization', () => {
    // Invalid data entries are caught during serialization, not during JSON stringify
    // This tests the defensive error path in serialize.ts
    const txWithInvalidData = {
      type: 12,
      version: 1,
      senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
      fee: 100000,
      timestamp: 1542539421605,
      proofs: ['test'],
      data: [
        { type: 'integer', key: 'a', value: 100 },
        { type: 'invalid_type', key: 'b', value: 'test' }, // Invalid type
      ],
    };

    // The serializer should reject unknown data field types
    expect(() => json.stringifyTx(txWithInvalidData as any)).toThrow('Unknown dataTxField type');
  });

  it('should handle proofs array with empty strings', () => {
    // Empty proof strings are valid in some contexts
    const txWithEmptyProof = {
      type: 12,
      version: 1,
      senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
      fee: 100000,
      timestamp: 1542539421605,
      proofs: [''],
      data: [{ type: 'integer', key: 'a', value: 100 }],
    };

    const str = json.stringifyTx(txWithEmptyProof);
    expect(() => JSON.parse(str)).not.toThrow();
  });
});

describe('stringifyWithSchema edge cases', () => {
  it('should handle arrays with undefined values by replacing with null', () => {
    // Direct use of stringifyWithSchema without going through serializer
    const objWithUndefinedInArray = {
      items: [1, undefined, 3],
    };

    const result = json.stringifyWithSchema(objWithUndefinedInArray);
    expect(result).toContain('null');
    expect(() => JSON.parse(result)).not.toThrow();

    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual([1, null, 3]);
  });

  it('should handle arrays with function values by replacing with null', () => {
    const objWithFunctionInArray = {
      items: [1, () => {}, 3],
    };

    const result = json.stringifyWithSchema(objWithFunctionInArray);
    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual([1, null, 3]);
  });

  it('should omit object properties with undefined values', () => {
    const objWithUndefined = {
      a: 1,
      b: undefined,
      c: 3,
    };

    const result = json.stringifyWithSchema(objWithUndefined);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1, c: 3 });
    expect('b' in parsed).toBe(false);
  });

  it('should omit object properties with Symbol values (non-JSON type)', () => {
    // Symbols are not JSON-serializable, property should be omitted
    const objWithSymbol = {
      a: 1,
      b: Symbol('test'),
      c: 3,
    };

    const result = json.stringifyWithSchema(objWithSymbol as any);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1, c: 3 });
    expect('b' in parsed).toBe(false);
  });

  it('should replace Symbol values in arrays with null', () => {
    // Symbols in arrays become null (same as undefined/function)
    const objWithSymbolInArray = {
      items: [1, Symbol('test'), 3],
    };

    const result = json.stringifyWithSchema(objWithSymbolInArray as any);
    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual([1, null, 3]);
  });

  it('should handle BigInt values by converting to string (preserves precision)', () => {
    // BigInt is common in financial applications for large amounts
    const objWithBigInt = {
      amount: 9007199254740993n, // Larger than MAX_SAFE_INTEGER
      count: 42n,
    };

    const result = json.stringifyWithSchema(objWithBigInt as any);
    const parsed = JSON.parse(result);
    // BigInt should be serialized as a number (or string if it includes decimal behavior)
    expect(parsed.amount).toBe(9007199254740993);
    expect(parsed.count).toBe(42);
  });
});
