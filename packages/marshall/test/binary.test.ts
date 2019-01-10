import { binary } from "../src";
import {exampleTxs, orderV0, orderV2} from "./exampleTxs";
import Long = require("long");
import BigNumber from "bignumber.js";
import {parserFromSchema} from "../src/parse";
import {orderSchemaV0} from "../src/schemas";

describe('Tx serialize/parse', ()=> {
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}`, () => {
      const bytes = binary.serializeTx(tx);
      const parsed = binary.parseTx<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
      expect(tx).toMatchObject(parsed)
    })
  });

  it('Should correctly serialize old order', ()=>{
    const bytes = binary.serializeOrder(orderV0);
    const parsed = parserFromSchema<number>(orderSchemaV0, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)})(bytes).value;
    expect(orderV0).toMatchObject(parsed)
  });

  it('Should correctly serialize new order', ()=>{
    const bytes = binary.serializeOrder(orderV2);
    const parsed = binary.parseOrder<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
    expect(orderV2).toMatchObject(parsed)
  });

  it('Should correctly serialize LONGjs', ()=>{
    const tx: any = exampleTxs[12];
    const bytes = binary.serializeTx({...tx, fee: Long.fromNumber(tx.fee)});
    const parsed = binary.parseTx<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
    expect(tx).toMatchObject(parsed)
  });

  it('Should convertLongFields LONGjs', ()=>{
    const tx = exampleTxs[12];
    const bytes = binary.serializeTx(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => Long.fromString(x)
    };

    const parsed = binary.parseTx(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(Long);
    expect(parsed.data[3].value).toBeInstanceOf(Long);
    expect(parsed.timestamp).toBeInstanceOf(Long)
  });

  it('Should convertLongFields to bignumber.js', ()=>{
    const tx = exampleTxs[12];
    const bytes = binary.serializeTx(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => new BigNumber(x)
    };

    const parsed = binary.parseTx(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(BigNumber);
    expect(parsed.data[3].value).toBeInstanceOf(BigNumber);
    expect(parsed.timestamp).toBeInstanceOf(BigNumber)
  })
})