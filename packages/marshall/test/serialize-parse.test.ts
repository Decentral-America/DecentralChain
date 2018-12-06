import { serializeTx, parseTx} from "../src";
import {exampleTxs, order} from "./exampleTxs";
import Long = require("long");
import BigNumber from "bignumber.js";
import {serializerFromSchema} from "../src/serialize";
import {orderSchemaV0} from "../src/txSchemas";
import {parserFromSchema} from "../src/parse";


describe('Tx serializeTx/parseTx', ()=> {
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}`, () => {
      const bytes = serializeTx(tx);
      const parsed = parseTx<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
      expect(tx).toMatchObject(parsed)
    })
  });

  it('Should correctly serialize order', ()=>{
    const bytes = serializerFromSchema(orderSchemaV0)(order);
    const parsed = parserFromSchema<number>(orderSchemaV0, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)})(bytes).value;
    expect(order).toMatchObject(parsed)
  });

  it('Should correctly serializeTx LONGjs', ()=>{
    const tx: any = exampleTxs[12];
    const bytes = serializeTx({...tx, fee: Long.fromNumber(tx.fee)});
    const parsed = parseTx<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
    expect(tx).toMatchObject(parsed)
  });

  it('Should convert LONGjs', ()=>{
    const tx = exampleTxs[12];
    const bytes = serializeTx(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => Long.fromString(x)
    };

    const parsed = parseTx(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(Long);
    expect(parsed.data[3].value).toBeInstanceOf(Long);
    expect(parsed.timestamp).toBeInstanceOf(Long)
  });

  it('Should convert to bignumber.js', ()=>{
    const tx = exampleTxs[12];
    const bytes = serializeTx(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => new BigNumber(x)
    };

    const parsed = parseTx(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(BigNumber);
    expect(parsed.data[3].value).toBeInstanceOf(BigNumber);
    expect(parsed.timestamp).toBeInstanceOf(BigNumber)
  })
})