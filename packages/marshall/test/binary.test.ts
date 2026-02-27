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
