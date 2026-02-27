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
