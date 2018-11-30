import {parse, parseJSON, serialize, stringify} from "../src";
import Long = require("long");
import {exampleTxs} from "./exampleTxs";

describe('Basic serialization', ()=> {
  const txJson = `{"type":12,"version":1,"senderPublicKey":"7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh",
  "fee":100000,"timestamp":1542539421605,"proofs":["5AMn7DEwZ6VvDLkJNdP5EW1PPJQKeWjy8qp5HoCGWaWWEPYdr1Ewkqor6NfLPDrGQdHd5DFUoE7CtwSrfAUMKLAY"],
  "id":"F7fkrYuJAsJfJRucwty7dcBoMS95xBufxBi7AXqCFgXg",
  "data":[{"type":"binary","key":"a","value":"base64:AQIDBA=="},{"type":"binary","key":"b","value":"base64:YXNkYQ=="},{"type":"boolean","key":"c","value":true},{"type":"integer","key":"d","value":9223372036854775808}]}`

  it('Should not break numbers', () => {
    const parsed = parseJSON(txJson);
    expect(typeof parsed.data[3].value).toBe('string')
    console.log()
  });

  it('Should convert numbers using factory', () => {
    const parsed = parseJSON(txJson, {toString:(x:any)=>x, fromString: x=> Long.fromString(x)});
    expect(parsed.data[3].value).toBeInstanceOf(Long)
  })


});

describe('All tx json to and from', ()=>{
  Object.entries(exampleTxs).forEach(([type, tx]) => {
    it(`Type: ${type}. toJSON, fromJSON`, () => {
      const str = stringify(tx);
      const parsed = parseJSON(str)
      expect(tx).toMatchObject(parsed)
    })
  });
});