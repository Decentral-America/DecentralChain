import { binary } from '../src';
import { exampleBytesStr, exampleTxs, orderV0, orderV2 } from './exampleTxs';
import Long from 'long';
import BigNumber from 'bignumber.js';
import { parserFromSchema } from '../src/parse';
import { orderSchemaV1 } from '../src/schemas';

describe('Tx serialize/parse', () => {
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}`, () => {
      const bytes = binary.serializeTx(tx);
      const parsed = binary.parseTx<number>(bytes, parseInt);
      // delete non serializable fields. Should write typesafe excludeKeys function instead
      delete (tx as any).proofs;
      delete (tx as any).signature;
      delete (tx as any).sender;
      delete (tx as any).id;
      expect(parsed).toMatchObject(tx);
    });
  });

  it('Should correctly serialize old order', () => {
    const bytes = binary.serializeOrder(orderV0);
    const parsed = parserFromSchema<number>(orderSchemaV1, parseInt)(bytes).value;
    expect(orderV0).toMatchObject(parsed);
  });

  it('Should correctly serialize new order', () => {
    const bytes = binary.serializeOrder(orderV2);
    const parsed = binary.parseOrder<number>(bytes, parseInt);
    expect(orderV2).toMatchObject(parsed);
  });

  it('Should correctly serialize LONGjs', () => {
    const tx: any = exampleTxs[12];
    const bytes = binary.serializeTx({ ...tx, fee: Long.fromNumber(tx.fee) });
    const parsed = binary.parseTx<number>(bytes, parseInt);
    expect(tx).toMatchObject(parsed);
  });

  it('Should convertLongFields LONGjs', () => {
    const tx = exampleTxs[12];
    const bytes = binary.serializeTx(tx);

    const parsed = binary.parseTx(bytes, Long.fromString);
    expect(parsed.fee).toBeInstanceOf(Long);
    expect(parsed.data[3].value).toBeInstanceOf(Long);
    expect(parsed.timestamp).toBeInstanceOf(Long);
  });

  it('Should convertLongFields to bignumber.js', () => {
    const tx = exampleTxs[12];
    const bytes = binary.serializeTx(tx);

    const parsed = binary.parseTx(bytes, (x) => new BigNumber(x));
    expect(parsed.fee).toBeInstanceOf(BigNumber);
    expect(parsed.data[3].value).toBeInstanceOf(BigNumber);
    expect(parsed.timestamp).toBeInstanceOf(BigNumber);
  });

  it('Should accept DCC as assetId', () => {
    const tx = { ...exampleTxs[4], assetId: 'DCC', feeAssetId: 'DCC' };
    const bytes = binary.serializeTx(tx);
    const parsed = binary.parseTx(bytes, parseInt);
    // delete non serializable fields. Should write typesafe excludeKeys function instead
    delete (tx as any).proofs;
    delete (tx as any).signature;
    delete (tx as any).sender;
    delete (tx as any).id;
    delete (tx as any).assetId;
    delete (tx as any).feeAssetId;
    expect(parsed).toMatchObject(tx);
  });

  it('Should get exact bytes for transactions', () => {
    Object.entries(exampleBytesStr).forEach(([type, bytesStr]) => {
      const tx = (exampleTxs as any)[type];
      const bytes = binary.serializeTx(tx).toString();
      expect(bytesStr).toEqual(bytes.toString());
    });
  });
});

describe('Serializer error handling - financial safety', () => {
  it('should reject unknown transaction type with explicit error', () => {
    const invalidTx = { type: 999, version: 1 };
    expect(() => binary.serializeTx(invalidTx)).toThrow('Incorrect tx type: 999');
  });

  it('should reject unsupported transaction version with explicit error', () => {
    // Type 4 (transfer) exists, but version 99 does not
    const invalidTx = { type: 4, version: 99 };
    expect(() => binary.serializeTx(invalidTx)).toThrow('Incorrect tx version: 99');
  });

  it('should reject unknown order version with explicit error', () => {
    const invalidOrder = { version: 99 };
    expect(() => binary.serializeOrder(invalidOrder)).toThrow('Unknown order version: 99');
  });

  it('should default to order version 1 when version is omitted', () => {
    // Verify backwards compatibility - orders without version should work
    const orderWithoutVersion = { ...orderV0 };
    delete (orderWithoutVersion as any).version;
    expect(() => binary.serializeOrder(orderWithoutVersion)).not.toThrow();
  });
});

describe('Transaction roundtrip integrity', () => {
  // Critical for financial systems: serialize → parse must be lossless
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`should preserve all fields for tx type ${type} after roundtrip`, () => {
      const bytes = binary.serializeTx(tx);
      const parsed = binary.parseTx<string>(bytes, String);

      // Verify critical financial fields are preserved
      if ('amount' in tx) {
        expect(parsed.amount).toBeDefined();
      }
      if ('fee' in tx) {
        expect(parsed.fee).toBeDefined();
      }

      // Re-serialize should produce identical bytes
      const reserializedBytes = binary.serializeTx(parsed);
      expect(reserializedBytes).toEqual(bytes);
    });
  });
});

describe('Script handling - null script support', () => {
  it('should handle SetScript transaction with null script (script removal)', () => {
    // Type 13 SetScript with null script clears dApp script
    const clearScriptTx = {
      type: 13,
      version: 1,
      fee: 1000000,
      senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
      timestamp: 1542539421635,
      chainId: 76,
      proofs: [
        '35x1Rphm1mr24ELJgpLP6dK3wMW7cG6nWsFUcMF3RvxKr3UjEuo4NfYnQf6MEanD7bxBdKDuYxbBJZYQQ495ax3w',
      ],
      script: null, // Null script clears the account script
    };

    const bytes = binary.serializeTx(clearScriptTx);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);

    const parsed = binary.parseTx(bytes, String);
    expect(parsed.script).toBeNull();
  });
});

describe('InvokeScript optional call handling', () => {
  it('should handle InvokeScript with no function call (default call)', () => {
    // When call is null/undefined, it invokes default()
    const invokeWithoutCall = {
      type: 16,
      version: 1,
      chainId: 76,
      senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
      dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
      call: null, // No function call - invokes default
      payment: [],
      fee: 500000,
      feeAssetId: null,
      timestamp: 1542539421700,
      proofs: [],
    };

    const bytes = binary.serializeTx(invokeWithoutCall);
    expect(bytes).toBeInstanceOf(Uint8Array);

    const parsed = binary.parseTx(bytes, String);
    // Optional fields return undefined when not present, not null
    expect(parsed.call).toBeUndefined();
  });
});
