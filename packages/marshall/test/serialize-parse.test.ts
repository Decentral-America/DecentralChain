import { serialize, parse} from "../src";
import {exampleTxs} from "./exampleTxs";
import Long = require("long");
import BigNumber from "bignumber.js";


describe('Tx serialize/parse', ()=> {
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}`, () => {
      const bytes = serialize(tx);
      const parsed = parse<number>(bytes, {toString: (x)=>String(x),fromString:(x)=>parseInt(x)});
      expect(tx).toMatchObject(parsed)
    })
  });

  it('Should convert LONGjs', ()=>{
    const tx = exampleTxs[12];
    const bytes = serialize(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => Long.fromString(x)
    };

    const parsed = parse(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(Long);
    expect(parsed.data[3].value).toBeInstanceOf(Long);
    expect(parsed.timestamp).toBeInstanceOf(Long)
  });

  it('Should convert to bignumber.js', ()=>{
    const tx = exampleTxs[12];
    const bytes = serialize(tx);

    const lfLongjs = {
      toString: (x:any)=>String(x),
      fromString: (x:string) => new BigNumber(x)
    };

    const parsed = parse(bytes, lfLongjs);
    expect(parsed.fee).toBeInstanceOf(BigNumber);
    expect(parsed.data[3].value).toBeInstanceOf(BigNumber);
    expect(parsed.timestamp).toBeInstanceOf(BigNumber)
  })
})