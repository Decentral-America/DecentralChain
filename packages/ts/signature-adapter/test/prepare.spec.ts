import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { prepare } from '../src/prepareTx/prepare';

const { processors } = prepare;

const dccAsset = new Asset({
  description: '',
  height: 0,
  id: 'DCC',
  name: 'DCC',
  precision: 8,
  quantity: new BigNumber(10000000000000000),
  reissuable: false,
  sender: '',
  ticker: 'DCC',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
});

const testAsset = new Asset({
  description: 'Some text',
  height: 100,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  name: 'Test',
  precision: 5,
  quantity: new BigNumber(10000),
  reissuable: false,
  sender: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
  ticker: undefined,
  timestamp: new Date(),
});

describe('prepare.processors', () => {
  describe('callFunc', () => {
    it('returns null when no callData', () => {
      expect(processors.callFunc(null)).toBeNull();
      expect(processors.callFunc(undefined)).toBeNull();
    });

    it('returns function and args from call data', () => {
      const result = processors.callFunc({
        args: [{ type: 'integer', value: 100 }],
        function: 'deposit',
      });
      expect(result).toEqual({ args: [{ type: 'integer', value: 100 }], function: 'deposit' });
    });

    it('defaults to empty function name and args', () => {
      const result = processors.callFunc({} as any);
      expect(result).toEqual({ args: [], function: '' });
    });
  });

  describe('payments', () => {
    it('maps Money to amount/assetId pairs', () => {
      const pay = Money.fromCoins(100000, dccAsset);
      const result = processors.payments([pay]);
      expect(result.length).toBe(1);
      expect(result[0]?.amount).toBe('100000');
      expect(result[0]?.assetId).toBe('');
    });

    it('handles empty/null input', () => {
      expect(processors.payments(null as any)).toEqual([]);
    });
  });

  describe('paymentsToNode', () => {
    it('maps Money keeping BigNumber and null for DCC', () => {
      const pay = Money.fromCoins(55555, dccAsset);
      const result = processors.paymentsToNode([pay]);
      expect(result[0]?.assetId).toBeNull();
      expect(result[0]?.amount.toString()).toBe('55555');
    });

    it('keeps non-DCC assetId', () => {
      const pay = Money.fromCoins(999, testAsset);
      const result = processors.paymentsToNode([pay]);
      expect(result[0]?.assetId).toBe(testAsset.id);
    });
  });

  describe('scriptProcessor', () => {
    it('returns code if not empty after replace', () => {
      expect(processors.scriptProcessor('base64:abc')).toBe('base64:abc');
    });

    it('returns null for empty code', () => {
      expect(processors.scriptProcessor('')).toBeNull();
      expect(processors.scriptProcessor(null as any)).toBeNull();
    });
  });

  describe('assetPair', () => {
    it('returns normalized amount/price asset IDs', () => {
      const data = {
        amount: { asset: { id: 'DCC' } },
        price: { asset: { id: testAsset.id } },
      };
      const result = processors.assetPair(data);
      expect(result.amountAsset).toBe('');
      expect(result.priceAsset).toBe(testAsset.id);
    });
  });

  describe('signatureFromProof', () => {
    it('returns first proof', () => {
      expect(processors.signatureFromProof(['sig1', 'sig2'])).toBe('sig1');
    });
  });

  describe('toBigNumber', () => {
    it('converts string', () => {
      const result = processors.toBigNumber('12345');
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toString()).toBe('12345');
    });

    it('converts number', () => {
      const result = processors.toBigNumber(42);
      expect(result.toString()).toBe('42');
    });

    it('returns BigNumber as-is', () => {
      const bn = new BigNumber(99);
      expect(processors.toBigNumber(bn)).toBe(bn);
    });

    it('converts Money to coins', () => {
      const money = Money.fromCoins(100000, dccAsset);
      const result = processors.toBigNumber(money);
      expect(result.toString()).toBe('100000');
    });
  });

  describe('toNumberString', () => {
    it('converts to string', () => {
      expect(processors.toNumberString(123)).toBe('123');
      expect(processors.toNumberString('456')).toBe('456');
    });
  });

  describe('toSponsorshipFee', () => {
    it('returns null when coins are 0', () => {
      const money = Money.fromCoins(0, dccAsset);
      expect(processors.toSponsorshipFee(money)).toBeNull();
    });

    it('returns coins when non-zero', () => {
      const money = Money.fromCoins(100000, dccAsset);
      const result = processors.toSponsorshipFee(money);
      expect(result?.toString()).toBe('100000');
    });
  });

  describe('moneyToAssetId / moneyToNodeAssetId', () => {
    it('returns asset ID', () => {
      const money = Money.fromCoins(1, testAsset);
      expect(processors.moneyToAssetId(money)).toBe(testAsset.id);
    });

    it('returns empty string for DCC node assetId', () => {
      const money = Money.fromCoins(1, dccAsset);
      expect(processors.moneyToNodeAssetId(money)).toBe('');
    });
  });

  describe('timestamp', () => {
    it('returns number timestamp as-is', () => {
      const now = Date.now();
      expect(processors.timestamp(now)).toBe(now);
    });

    it('converts Date to getTime()', () => {
      const date = new Date('2024-01-01');
      expect(processors.timestamp(date)).toBe(date.getTime());
    });

    it('parses date string', () => {
      const result = processors.timestamp('2024-01-01');
      expect(typeof result).toBe('number');
    });
  });

  describe('orString', () => {
    it('returns data or empty string', () => {
      expect(processors.orString('hello')).toBe('hello');
      expect(processors.orString(null)).toBe('');
      expect(processors.orString(undefined)).toBe('');
    });
  });

  describe('noProcess', () => {
    it('returns data as-is', () => {
      const obj = { a: 1 };
      expect(processors.noProcess(obj)).toBe(obj);
    });
  });

  describe('recipient', () => {
    it('adds alias prefix for short addresses', () => {
      const fn = processors.recipient('W');
      expect(fn('myalias')).toBe('alias:W:myalias');
    });

    it('returns long address as-is', () => {
      const fn = processors.recipient('W');
      const longAddr = '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM';
      expect(fn(longAddr)).toBe(longAddr);
    });
  });

  describe('attachment', () => {
    it('converts string to base58', () => {
      const result = processors.attachment('hello');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts Uint8Array to base58', () => {
      const result = processors.attachment(new Uint8Array([1, 2, 3]));
      expect(typeof result).toBe('string');
    });

    it('handles empty value', () => {
      const result = processors.attachment('');
      expect(typeof result).toBe('string');
    });
  });

  describe('addValue', () => {
    it('wraps non-function values', () => {
      const fn = processors.addValue(42);
      expect(fn()).toBe(42);
    });

    it('returns function as-is', () => {
      const fn = () => 99;
      expect(processors.addValue(fn)).toBe(fn);
    });
  });

  describe('expiration', () => {
    it('returns provided date', () => {
      expect(processors.expiration(12345)).toBe(12345);
    });

    it('returns default when not provided', () => {
      const result = processors.expiration();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(Date.now());
    });
  });

  describe('transfers', () => {
    it('maps transfers with recipient and amount processors', () => {
      const recipientFn = (r: string) => r;
      const amountFn = (a: string) => a;
      const fn = processors.transfers(recipientFn, amountFn);
      const result = fn([{ amount: '100', recipient: 'addr1' }]);
      expect(result).toEqual([{ amount: '100', recipient: 'addr1' }]);
    });
  });

  describe('quantity', () => {
    it('calculates quantity with precision', () => {
      const result = processors.quantity({ precision: 2, quantity: 100 });
      expect(result.toString()).toBe('10000');
    });
  });

  describe('base64', () => {
    it('strips base64: prefix', () => {
      expect(processors.base64('base64:abc')).toBe('abc');
    });

    it('handles empty/null values', () => {
      expect(processors.base64('')).toBe('');
      expect(processors.base64(null)).toBe('');
    });
  });

  describe('toOrderPrice', () => {
    it('converts order to matcher coins', () => {
      const order = {
        amount: Money.fromTokens(1, dccAsset),
        price: Money.fromTokens(0.5, testAsset),
      };
      const result = processors.toOrderPrice(order);
      expect(typeof result.toString()).toBe('string');
    });
  });
});

describe('prepare.wrap', () => {
  it('wraps a function', () => {
    const fn = (x: number) => x * 2;
    const result = prepare.wrap('from', 'to', fn);
    expect(result.from).toBe('from');
    expect(result.to).toBe('to');
    expect(result.cb(5)).toBe(10);
  });

  it('wraps a non-function value', () => {
    const result = prepare.wrap('from', 'to', 42);
    expect(result.cb()).toBe(42);
  });

  it('wraps with null from', () => {
    const result = prepare.wrap(null, 'to', (d: any) => d);
    expect(result.from).toBeNull();
  });
});

describe('prepare.schema', () => {
  it('constructs object from schema with string fields', () => {
    const schemaFn = prepare.schema('name', 'age');
    const result = schemaFn({ age: 30, name: 'Alice' });
    expect(result).toEqual({ age: 30, name: 'Alice' });
  });

  it('constructs object from schema with wrapped fields', () => {
    const schemaFn = prepare.schema(
      prepare.wrap('name', 'fullName', (v: string) => v.toUpperCase()),
    );
    const result = schemaFn({ name: 'alice' });
    expect(result).toEqual({ fullName: 'ALICE' });
  });
});

describe('prepare.signSchema', () => {
  it('processes args with processors', () => {
    const schemaFn = prepare.signSchema([
      {
        field: 'amount',
        name: 'amount',
        optional: false,
        optionalData: null,
        processor: processors.toNumberString,
        type: 'number',
      },
    ]);
    const result = schemaFn({ amount: 12345 });
    expect(result).toEqual({ amount: '12345' });
  });

  it('validates when validate=true and throws on error', () => {
    const schemaFn = prepare.signSchema([
      {
        field: 'amount',
        name: 'amount',
        optional: false,
        optionalData: null,
        processor: processors.noProcess,
        type: 'number',
      },
    ]);
    expect(() => schemaFn({ amount: 'not-a-number' }, true)).toThrow();
  });

  it('passes validation for valid data', () => {
    const schemaFn = prepare.signSchema([
      {
        field: 'amount',
        name: 'amount',
        optional: false,
        optionalData: null,
        processor: processors.toNumberString,
        type: 'number',
      },
    ]);
    const result = schemaFn({ amount: 100 }, true);
    expect(result.amount).toBe('100');
  });
});

describe('prepare.idToNode', () => {
  it('returns empty for DCC', () => {
    expect(prepare.idToNode('DCC')).toBe('');
  });

  it('returns id for non-DCC', () => {
    expect(prepare.idToNode('someAssetId')).toBe('someAssetId');
  });
});
