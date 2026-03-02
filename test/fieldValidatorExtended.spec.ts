import { VALIDATORS, isValidAddress } from '../src/prepareTx/fieldValidator';
import { Money, Asset } from '@decentralchain/data-entities';
import { BigNumber } from '@decentralchain/bignumber';

const dccAsset = new Asset({
  precision: 8,
  id: 'DCC',
  quantity: new BigNumber(10000000000000000),
  description: '',
  height: 0,
  name: 'DCC',
  reissuable: false,
  sender: '',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
  ticker: 'DCC',
});

const opts = (value: any, overrides: any = {}) => ({
  key: 'test',
  value,
  optional: false,
  type: 'string',
  name: 'testField',
  ...overrides,
});

describe('fieldValidator - extended coverage', () => {
  describe('httpsUrl', () => {
    it('passes for valid https URL', () => {
      expect(() => VALIDATORS.httpsUrl(opts('https://example.com'))).not.toThrow();
    });

    it('throws for non-string', () => {
      expect(() => VALIDATORS.httpsUrl(opts(123))).toThrow();
    });

    it('throws for non-https URL', () => {
      expect(() => VALIDATORS.httpsUrl(opts('http://example.com'))).toThrow();
    });

    it('throws for invalid URL with https', () => {
      expect(() => VALIDATORS.httpsUrl(opts('https://'))).toThrow();
    });

    it('returns null for null optional', () => {
      expect(VALIDATORS.httpsUrl(opts(null, { optional: true }))).toBeNull();
    });
  });

  describe('binary', () => {
    it('passes for valid base64 string', () => {
      expect(() => VALIDATORS.binary(opts('base64:SGVsbG8='))).not.toThrow();
    });

    it('throws when missing base64: prefix', () => {
      expect(() => VALIDATORS.binary(opts('SGVsbG8='))).toThrow();
    });

    it('throws for invalid base64 content', () => {
      expect(() => VALIDATORS.binary(opts('base64:!!invalid!!'))).toThrow();
    });

    it('passes for empty value', () => {
      expect(() => VALIDATORS.binary(opts(''))).not.toThrow();
      expect(() => VALIDATORS.binary(opts(undefined))).not.toThrow();
    });
  });

  describe('publicKey', () => {
    it('throws for empty string', () => {
      expect(() => VALIDATORS.publicKey(opts(''))).toThrow();
    });

    it('throws for non-string', () => {
      expect(() => VALIDATORS.publicKey(opts(123))).toThrow();
    });

    it('throws for invalid base58', () => {
      expect(() => VALIDATORS.publicKey(opts('not-valid-base58!!!'))).toThrow();
    });

    it('throws for wrong-length key', () => {
      // Valid base58 but only 4 bytes
      expect(() => VALIDATORS.publicKey(opts('1111'))).toThrow();
    });

    it('passes for valid 32-byte public key', () => {
      expect(() =>
        VALIDATORS.publicKey(opts('FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28')),
      ).not.toThrow();
    });
  });

  describe('asset_script', () => {
    it('throws for empty script', () => {
      expect(() => VALIDATORS.asset_script(opts(''))).toThrow();
    });

    it('throws for base64: with empty content', () => {
      expect(() => VALIDATORS.asset_script(opts('base64:'))).toThrow();
    });

    it('passes for valid script', () => {
      expect(() => VALIDATORS.asset_script(opts('base64:SGVsbG8='))).not.toThrow();
    });
  });

  describe('call', () => {
    it('passes with valid call data', () => {
      expect(() => VALIDATORS.call(opts({ function: 'deposit', args: [] }))).not.toThrow();
    });

    it('throws for empty function name', () => {
      expect(() => VALIDATORS.call(opts({ function: '', args: [] }))).toThrow();
    });

    it('throws for non-object value', () => {
      expect(() => VALIDATORS.call(opts('not-an-object'))).toThrow();
    });

    it('returns for null optional value', () => {
      expect(VALIDATORS.call(opts(null, { optional: true }))).toBeUndefined();
    });

    it('validates args when present', () => {
      expect(() =>
        VALIDATORS.call(
          opts({
            function: 'test',
            args: [{ type: 'integer', value: 42 }],
          }),
        ),
      ).not.toThrow();
    });
  });

  describe('payment', () => {
    it('passes for valid Money array', () => {
      const money = Money.fromCoins(1000, dccAsset);
      expect(() => VALIDATORS.payment(opts([money]))).not.toThrow();
    });

    it('throws for non-array', () => {
      expect(() => VALIDATORS.payment(opts('not-array'))).toThrow();
    });

    it('throws for invalid money item', () => {
      expect(() => VALIDATORS.payment(opts([42]))).toThrow();
    });

    it('passes for empty array', () => {
      expect(() => VALIDATORS.payment(opts([]))).not.toThrow();
    });
  });

  describe('data', () => {
    it('passes for valid integer data entry', () => {
      expect(() => VALIDATORS.data(opts([{ key: 'k', type: 'integer', value: 42 }]))).not.toThrow();
    });

    it('passes for valid boolean data entry', () => {
      expect(() =>
        VALIDATORS.data(opts([{ key: 'k', type: 'boolean', value: true }])),
      ).not.toThrow();
    });

    it('passes for valid binary data entry', () => {
      expect(() =>
        VALIDATORS.data(opts([{ key: 'k', type: 'binary', value: 'base64:SGVsbG8=' }])),
      ).not.toThrow();
    });

    it('passes for valid string data entry', () => {
      expect(() =>
        VALIDATORS.data(opts([{ key: 'k', type: 'string', value: 'hello' }])),
      ).not.toThrow();
    });

    it('passes for null/undefined type (delete entry)', () => {
      expect(() =>
        VALIDATORS.data(opts([{ key: 'k', type: undefined, value: null }])),
      ).not.toThrow();
    });

    it('throws for unknown type', () => {
      expect(() => VALIDATORS.data(opts([{ key: 'k', type: 'unknown', value: 'x' }]))).toThrow();
    });

    it('throws for non-array', () => {
      expect(() => VALIDATORS.data(opts('not-array'))).toThrow();
    });

    it('validates key as string', () => {
      expect(() =>
        VALIDATORS.data(opts([{ key: null, type: 'string', value: 'hello' }])),
      ).toThrow();
    });
  });

  describe('numberLike edge cases', () => {
    it('validates BigNumber', () => {
      expect(() => VALIDATORS.numberLike(opts(new BigNumber(100)))).not.toThrow();
    });

    it('throws for NaN BigNumber', () => {
      expect(() => VALIDATORS.numberLike(opts(new BigNumber('not-a-number')))).toThrow();
    });

    it('validates Money', () => {
      const money = Money.fromCoins(100, dccAsset);
      expect(() => VALIDATORS.numberLike(opts(money))).not.toThrow();
    });

    it('throws for empty string', () => {
      expect(() => VALIDATORS.numberLike(opts(''))).toThrow();
    });
  });

  describe('boolean', () => {
    it('passes for true/false', () => {
      expect(() => VALIDATORS.boolean(opts(true))).not.toThrow();
      expect(() => VALIDATORS.boolean(opts(false))).not.toThrow();
    });

    it('throws for non-boolean', () => {
      expect(() => VALIDATORS.boolean(opts('true'))).toThrow();
    });
  });

  describe('script', () => {
    it('passes for valid base64 script', () => {
      expect(() => VALIDATORS.script(opts('base64:SGVsbG8='))).not.toThrow();
    });

    it('throws for non-base64', () => {
      expect(() => VALIDATORS.script(opts('not-base64'))).toThrow();
    });
  });

  describe('precision', () => {
    it('passes for valid precision 0-8', () => {
      expect(() => VALIDATORS.precision(opts(0))).not.toThrow();
      expect(() => VALIDATORS.precision(opts(8))).not.toThrow();
    });

    it('throws for precision > 8', () => {
      expect(() => VALIDATORS.precision(opts(9))).toThrow();
    });

    it('throws for negative precision', () => {
      expect(() => VALIDATORS.precision(opts(-1))).toThrow();
    });
  });

  describe('attachment edge cases', () => {
    it('passes for valid string under limit', () => {
      expect(() => VALIDATORS.attachment(opts('hello'))).not.toThrow();
    });

    it('throws for too-long string', () => {
      expect(() => VALIDATORS.attachment(opts('a'.repeat(200)))).toThrow();
    });

    it('handles array-like objects', () => {
      expect(() => VALIDATORS.attachment(opts([1, 2, 3]))).not.toThrow();
    });

    it('throws for array-like with length > 140', () => {
      expect(() => VALIDATORS.attachment(opts(new Array(200).fill(0)))).toThrow();
    });

    it('passes for null value', () => {
      expect(() => VALIDATORS.attachment(opts(null))).not.toThrow();
    });

    it('throws for non-string/non-array object with no length', () => {
      expect(() => VALIDATORS.attachment(opts({ foo: 'bar' }))).toThrow();
    });
  });

  describe('transfers', () => {
    it('throws for non-array', () => {
      expect(() => VALIDATORS.transfers(opts('not-array'))).toThrow();
    });

    it('throws for empty non-optional', () => {
      expect(() => VALIDATORS.transfers(opts([]))).toThrow();
    });

    it('passes for valid transfers with amount and recipient', () => {
      expect(() =>
        VALIDATORS.transfers(
          opts(
            [
              {
                recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
                amount: 100,
              },
            ],
            { optionalData: 87 },
          ),
        ),
      ).not.toThrow();
    });
  });

  describe('isValidAddress', () => {
    it('throws for missing address', () => {
      expect(() => isValidAddress('', 87)).toThrow('Missing or invalid address');
      expect(() => isValidAddress(null as any, 87)).toThrow('Missing or invalid address');
    });
  });
});
