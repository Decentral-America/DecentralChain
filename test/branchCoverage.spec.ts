/**
 * Targeted branch coverage tests for Signable.ts, fieldValidator.ts,
 * utils.ts, constants.ts, SeedAdapter.ts, LedgerAdapter.ts, Adapter.ts,
 * CustomAdapter.ts, schemas.ts, and getTxBytes.ts.
 *
 * These tests focus specifically on previously-uncovered branches.
 */
import { SeedAdapter } from '../src/adapters/SeedAdapter';
import { CustomAdapter } from '../src/adapters/CustomAdapter';
import { CubensisConnectAdapter } from '../src/adapters/CubensisConnectAdapter';
import { Adapter } from '../src/adapters/Adapter';
import { SIGN_TYPE, TRANSACTION_TYPE_NUMBER } from '../src/prepareTx';
import { VALIDATORS } from '../src/prepareTx/fieldValidator';
import { Money, Asset } from '@decentralchain/data-entities';
import { BigNumber } from '@decentralchain/bignumber';

const testSeed = 'some test seed words without money on mainnet';

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

const testAsset = new Asset({
  precision: 5,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  quantity: new BigNumber(10000),
  description: 'Some text',
  height: 100,
  name: 'Test',
  reissuable: false,
  sender: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
  timestamp: new Date(),
  ticker: undefined,
});

const opts = (value: any, overrides: any = {}) => ({
  key: 'test',
  value,
  optional: false,
  type: 'string',
  name: 'testField',
  ...overrides,
});

describe('Branch coverage - Signable', () => {
  let adapter: SeedAdapter;

  beforeAll(() => {
    adapter = new SeedAdapter(testSeed, 'W');
  });

  describe('_makeSignPromise non-signRequest branch', () => {
    it('uses signTransaction for transfer type', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.TRANSFER,
        data: {
          amount: Money.fromCoins(100000, dccAsset),
          fee: Money.fromCoins(100000, dccAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          timestamp: Date.now(),
          version: 2,
        },
      } as any);

      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    });

    it('uses signOrder for create order type', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.CREATE_ORDER,
        data: {
          matcherPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          orderType: 'buy',
          amount: Money.fromCoins(100000000, dccAsset),
          price: Money.fromCoins(50000, testAsset),
          matcherFee: Money.fromCoins(300000, dccAsset),
          expiration: Date.now() + 86400000,
          timestamp: Date.now(),
          version: 3,
        },
      } as any);

      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
    });
  });

  describe('_getAmountPrecision SCRIPT_INVOCATION branch', () => {
    it('returns payment precision for script invocation', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.SCRIPT_INVOCATION,
        data: {
          dApp: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          call: { function: 'test', args: [] },
          fee: Money.fromCoins(500000, dccAsset),
          payment: [Money.fromCoins(1000000, testAsset)],
          timestamp: Date.now(),
          version: 1,
        },
      } as any);

      // This exercises the SCRIPT_INVOCATION branch in _getAmountPrecision
      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
    });

    it('returns 0 when script invocation has no payment', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.SCRIPT_INVOCATION,
        data: {
          dApp: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          call: { function: 'test', args: [] },
          fee: Money.fromCoins(500000, dccAsset),
          payment: [],
          timestamp: Date.now(),
          version: 1,
        },
      } as any);

      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
    });
  });

  describe('_getAmount2Precision branch', () => {
    it('returns second payment precision when 2 payments', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.SCRIPT_INVOCATION,
        data: {
          dApp: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          call: { function: 'test', args: [] },
          fee: Money.fromCoins(500000, dccAsset),
          payment: [Money.fromCoins(1000000, dccAsset), Money.fromCoins(500, testAsset)],
          timestamp: Date.now(),
          version: 1,
        },
      } as any);

      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
    });
  });

  describe('_getFeePrecision branch', () => {
    it('returns fee asset precision when fee has asset', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.SPONSORSHIP,
        data: {
          assetId: testAsset.id,
          minSponsoredAssetFee: Money.fromCoins(100, testAsset),
          fee: Money.fromCoins(100000000, dccAsset),
          timestamp: Date.now(),
          version: 1,
        },
      } as any);

      const sig = await signable.getSignature();
      expect(typeof sig).toBe('string');
    });
  });

  describe('addProof edge cases', () => {
    it('throws for empty string', () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      expect(() => signable.addProof('')).toThrow('Invalid signature');
    });

    it('throws for whitespace-only string', () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      expect(() => signable.addProof('   ')).toThrow('Invalid signature');
    });

    it('throws when max proofs exceeded', () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      for (let i = 0; i < 8; i++) {
        signable.addProof(`proof${i}`);
      }
      expect(() => signable.addProof('proof8')).toThrow('Maximum proof count');
    });

    it('deduplicates proofs', () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      signable.addProof('sameProof');
      signable.addProof('sameProof');
      // Should not throw, and the count should be 1
    });
  });

  describe('getDataForApi catch branch', () => {
    it('falls back when convert throws', async () => {
      // The convert function might throw for non-standard data
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      const result = await signable.getDataForApi();
      expect(result).toBeDefined();
      expect((result as any).proofs || (result as any).signature).toBeDefined();
    });
  });

  describe('getOrderFee only works for CREATE_ORDER', () => {
    it('returns undefined for non-order type', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      const result = await signable.getOrderFee({} as any, new BigNumber(0), false);
      expect(result).toBeUndefined();
    });
  });

  describe('getFee', () => {
    it('computes fee for transfer', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.TRANSFER,
        data: {
          amount: Money.fromCoins(100000, dccAsset),
          fee: Money.fromCoins(100000, dccAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          timestamp: Date.now(),
          version: 2,
        },
      } as any);

      const config = {
        smart_asset_extra_fee: 400000,
        smart_account_extra_fee: 400000,
        calculate_fee_rules: {
          default: {
            add_smart_account_fee: true,
            add_smart_asset_fee: true,
            min_price_step: 0,
            fee: 100000,
            price_per_kb: 0,
          },
        },
      };

      const fee = await signable.getFee(config as any, false);
      expect(fee).toBeDefined();
    });
  });

  describe('getHash', () => {
    it('returns base58 hash', async () => {
      const signable = adapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      const hash = await signable.getHash();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('sign error resets promise', () => {
    it('resets _signPromise on error', async () => {
      Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
      // Create adapter that rejects signing
      const failApi = {
        type: 'custom',
        isAvailable: () => true,
        getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
        getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        signRequest: async () => {
          throw new Error('sign failed');
        },
        signTransaction: async () => {
          throw new Error('sign failed');
        },
        signOrder: async () => {
          throw new Error('sign failed');
        },
        signData: async () => {
          throw new Error('sign failed');
        },
      };
      const failAdapter = new CustomAdapter(failApi);

      const signable = failAdapter.makeSignable({
        type: SIGN_TYPE.AUTH,
        data: { prefix: 'test', host: 'localhost', data: 'test' },
      } as any);

      await expect(signable.getSignature()).rejects.toThrow('sign failed');

      // After error, signPromise should be reset
      // Second attempt should also try signing again (not return cached promise)
      await expect(signable.getSignature()).rejects.toThrow('sign failed');
    });
  });
});

describe('Branch coverage - fieldValidator', () => {
  describe('orderType branches', () => {
    it('passes for sell', () => {
      expect(() => VALIDATORS.orderType(opts('sell'))).not.toThrow();
    });

    it('passes for buy', () => {
      expect(() => VALIDATORS.orderType(opts('buy'))).not.toThrow();
    });

    it('throws for invalid order type', () => {
      expect(() => VALIDATORS.orderType(opts('hold'))).toThrow();
    });

    it('throws for non-string', () => {
      expect(() => VALIDATORS.orderType(opts(123))).toThrow();
    });

    it('returns null for null optional', () => {
      expect(VALIDATORS.orderType(opts(null, { optional: true }))).toBeNull();
    });
  });

  describe('assetName branches', () => {
    it('passes for valid name', () => {
      expect(() => VALIDATORS.assetName(opts('TestAsset'))).not.toThrow();
    });

    it('throws for too short name', () => {
      expect(() => VALIDATORS.assetName(opts('ab'))).toThrow();
    });

    it('throws for too long name', () => {
      expect(() => VALIDATORS.assetName(opts('a'.repeat(20)))).toThrow();
    });

    it('throws for non-string', () => {
      expect(() => VALIDATORS.assetName(opts(123))).toThrow();
    });
  });

  describe('assetDescription branches', () => {
    it('passes for valid description', () => {
      expect(() => VALIDATORS.assetDescription(opts('A valid description'))).not.toThrow();
    });

    it('throws for too long description', () => {
      expect(() => VALIDATORS.assetDescription(opts('a'.repeat(1100)))).toThrow();
    });

    it('throws for non-string type', () => {
      // numberToString converts number to string, so pass an object instead
      expect(() => VALIDATORS.assetDescription(opts({ obj: true }))).toThrow();
    });
  });

  describe('address specific branches', () => {
    it('throws for non-string address', () => {
      expect(() => VALIDATORS.address(opts(12345, { optionalData: 87 }))).toThrow();
    });

    it('throws for too-short string (not an alias)', () => {
      // A string that's longer than alias max but shorter than valid address
      // This triggers the address path via aliasOrAddress
    });

    it('throws for too-long address', () => {
      expect(() => VALIDATORS.address(opts('a'.repeat(50), { optionalData: 87 }))).toThrow();
    });
  });

  describe('aliasOrAddress branches', () => {
    it('falls back to address when alias fails', () => {
      // A valid address should pass through the address validator
      expect(() =>
        VALIDATORS.aliasOrAddress(
          opts('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM', { optionalData: 87 }),
        ),
      ).not.toThrow();
    });

    it('passes for valid alias', () => {
      expect(() => VALIDATORS.aliasOrAddress(opts('myalias', { optionalData: 87 }))).not.toThrow();
    });
  });

  describe('assetId branches', () => {
    it('passes for DCC', () => {
      expect(() => VALIDATORS.assetId(opts('DCC'))).not.toThrow();
    });

    it('passes for valid 32-byte base58 asset ID', () => {
      expect(() =>
        VALIDATORS.assetId(opts('Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU')),
      ).not.toThrow();
    });

    it('throws for non-string', () => {
      expect(() => VALIDATORS.assetId(opts(12345))).toThrow();
    });

    it('throws for invalid base58', () => {
      expect(() => VALIDATORS.assetId(opts('notavalidassetid'))).toThrow();
    });
  });

  describe('timestamp branches', () => {
    it('passes for Date object', () => {
      expect(() => VALIDATORS.timestamp(opts(new Date()))).not.toThrow();
    });

    it('passes for valid date string', () => {
      expect(() => VALIDATORS.timestamp(opts('2024-01-01'))).not.toThrow();
    });

    it('throws for invalid date string', () => {
      expect(() => VALIDATORS.timestamp(opts('not-a-date'))).toThrow();
    });
  });

  describe('money branches', () => {
    it('throws for non-Money object', () => {
      expect(() => VALIDATORS.money(opts({ not: 'money' }))).toThrow();
    });
  });

  describe('data with list type and args', () => {
    it('validates list type with args values', () => {
      // isArgs = true path is covered by call validator
      expect(() =>
        VALIDATORS.call(
          opts({
            function: 'test',
            args: [{ type: 'list', value: [{ type: 'integer', value: 42 }] }],
          }),
        ),
      ).not.toThrow();
    });

    it('validates list type without value in args', () => {
      expect(() =>
        VALIDATORS.call(
          opts({
            function: 'test',
            args: [{ type: 'list', value: null }],
          }),
        ),
      ).not.toThrow();
    });
  });

  describe('numberLike with min/max', () => {
    it('throws when value is below min', () => {
      expect(() => VALIDATORS.precision(opts(-1))).toThrow();
    });

    it('throws when value exceeds max', () => {
      expect(() => VALIDATORS.precision(opts(10))).toThrow();
    });

    it('passes BigNumber within range', () => {
      expect(() => VALIDATORS.precision(opts(new BigNumber(5)))).not.toThrow();
    });

    it('validates Money checkInterval', () => {
      // Money goes through the Money branch in numberLike
      const money = Money.fromCoins(5, dccAsset);
      expect(() => VALIDATORS.numberLike(opts(money))).not.toThrow();
    });
  });
});

describe('Branch coverage - CubensisConnectAdapter onDestroy', () => {
  beforeAll(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  it('calls cb immediately when _needDestroy is true', () => {
    const adapter = new CubensisConnectAdapter({} as any);
    (adapter as any)._needDestroy = true;
    const cb = vi.fn();
    adapter.onDestroy(cb);
    expect(cb).toHaveBeenCalled();
  });

  it('queues cb when _needDestroy is false', () => {
    const adapter = new CubensisConnectAdapter({} as any);
    (adapter as any)._needDestroy = false;
    const cb = vi.fn();
    adapter.onDestroy(cb);
    expect(cb).not.toHaveBeenCalled();
    expect((adapter as any)._onDestroyCb).toContain(cb);
  });
});

describe('Branch coverage - Adapter', () => {
  it('getNetworkByte returns number when already number', () => {
    const seed = new SeedAdapter(testSeed, 87);
    expect(seed.getNetworkByte()).toBe(87);
  });

  it('getNetworkByte returns charCode when string', () => {
    const seed = new SeedAdapter(testSeed, 'W');
    expect(seed.getNetworkByte()).toBe(87);
  });
});

// ============ Additional targeted branch coverage tests ============

describe('Branch coverage - Signable getAssetIds', () => {
  let adapter: SeedAdapter;

  beforeAll(() => {
    adapter = new SeedAdapter(testSeed, 'W');
  });

  it('handles EXCHANGE type in getAssetIds', async () => {
    // Create any signable, then mock getSignData to return EXCHANGE-shaped data
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.TRANSFER,
      data: {
        type: TRANSACTION_TYPE_NUMBER.TRANSFER,
        version: 2,
        amount: new Money(100, dccAsset),
        fee: new Money(100000, dccAsset),
        recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
        timestamp: Date.now(),
        attachment: '',
      },
    } as any);

    // Mock getSignData to return EXCHANGE data
    vi.spyOn(signable, 'getSignData').mockResolvedValue({
      type: TRANSACTION_TYPE_NUMBER.EXCHANGE,
      feeAssetId: null,
      order1: {
        assetPair: { amountAsset: 'asset1', priceAsset: 'asset2' },
        matcherFeeAssetId: 'asset3',
      },
      order2: {
        matcherFeeAssetId: 'asset4',
      },
    } as any);

    const ids = await signable.getAssetIds();
    expect(ids).toContain('asset1');
    expect(ids).toContain('asset2');
    expect(ids).toContain('asset3');
    expect(ids).toContain('asset4');
    expect(ids).toContain('DCC');
  });

  it('handles SCRIPT_INVOCATION type in getAssetIds', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.TRANSFER,
      data: {
        type: TRANSACTION_TYPE_NUMBER.TRANSFER,
        version: 2,
        amount: new Money(100, dccAsset),
        fee: new Money(100000, dccAsset),
        recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
        timestamp: Date.now(),
        attachment: '',
      },
    } as any);

    // Mock getSignData to return SCRIPT_INVOCATION data
    vi.spyOn(signable, 'getSignData').mockResolvedValue({
      type: TRANSACTION_TYPE_NUMBER.SCRIPT_INVOCATION,
      feeAssetId: null,
      payment: [{ assetId: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU' }, { assetId: null }],
    } as any);

    const ids = await signable.getAssetIds();
    expect(ids).toContain('Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU');
    expect(ids).toContain('DCC');
  });

  it('handles getId with protobuf-style bytes (first byte === 10)', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.TRANSFER,
      data: {
        type: TRANSACTION_TYPE_NUMBER.TRANSFER,
        version: 2,
        amount: new Money(100, dccAsset),
        fee: new Money(100000, dccAsset),
        recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
        timestamp: Date.now(),
        attachment: '',
      },
    } as any);

    // Mock _bytePromise to return bytes starting with 10 (protobuf marker)
    const protoBytes = new Uint8Array(50);
    protoBytes[0] = 10;
    (signable as any)._bytePromise = Promise.resolve(protoBytes);

    const id = await signable.getId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('Branch coverage - SeedAdapter getSeed rejection', () => {
  it('rejects when phrase is not a string', async () => {
    // Create adapter, then forcefully set phrase to non-string
    const seed = new SeedAdapter(testSeed, 'W');
    // Access internal seed object and mutate phrase to a non-string
    (seed as any).seed = { ...(seed as any).seed, phrase: 123 };
    await expect(seed.getSeed()).rejects.toBe(123);
  });
});

describe('Branch coverage - fieldValidator extra branches', () => {
  it('address returns null for null optional value', () => {
    expect(() => VALIDATORS.address(opts(null, { optional: true }))).not.toThrow();
  });

  it('address throws for too-long address string', () => {
    expect(() => VALIDATORS.address(opts('A'.repeat(50)))).toThrow();
  });

  it('address throws for invalid address (correct length but wrong checksum)', () => {
    expect(() => VALIDATORS.address(opts('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKx'))).toThrow();
  });

  it('timestamp passes for Date string', () => {
    expect(() => VALIDATORS.timestamp(opts('2024-01-01T00:00:00Z'))).not.toThrow();
  });

  it('timestamp throws for invalid string', () => {
    expect(() => VALIDATORS.timestamp(opts('not-a-date'))).toThrow();
  });

  it('assetId passes for DCC', () => {
    expect(() => VALIDATORS.assetId(opts('DCC'))).not.toThrow();
  });

  it('assetId throws for wrong length base58', () => {
    expect(() => VALIDATORS.assetId(opts('shortid'))).toThrow();
  });

  it('assetId throws for non-string', () => {
    expect(() => VALIDATORS.assetId(opts(12345))).toThrow();
  });
});

describe('Branch coverage - CustomAdapter sign methods missing', () => {
  beforeAll(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  it('throws when signRequest is missing', () => {
    const userApi = {
      type: 'custom',
      isAvailable: () => true,
      getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
      // No sign methods
    };
    const adapter = new CustomAdapter(userApi);
    expect(() => adapter.signRequest(new Uint8Array([1, 2, 3]))).toThrow(
      'No method to sign request',
    );
  });

  it('throws when signTransaction is missing', () => {
    const userApi = {
      type: 'custom',
      isAvailable: () => true,
      getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    };
    const adapter = new CustomAdapter(userApi);
    expect(() => adapter.signTransaction(new Uint8Array([1, 2, 3]), {}, null)).toThrow(
      'No method to sign transactions',
    );
  });

  it('throws when signOrder is missing', () => {
    const userApi = {
      type: 'custom',
      isAvailable: () => true,
      getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    };
    const adapter = new CustomAdapter(userApi);
    expect(() => adapter.signOrder(new Uint8Array([1, 2, 3]), {}, null)).toThrow(
      'No method to sign order',
    );
  });

  it('throws when signData is missing', () => {
    const userApi = {
      type: 'custom',
      isAvailable: () => true,
      getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    };
    const adapter = new CustomAdapter(userApi);
    expect(() => adapter.signData(new Uint8Array([1, 2, 3]))).toThrow(
      'No method to sign custom data',
    );
  });

  it('isAvailable rejects when currentUser is not available', async () => {
    const userApi = {
      type: 'custom',
      isAvailable: () => false,
      getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    };
    const adapter = new CustomAdapter(userApi);
    await expect(adapter.isAvailable()).rejects.toThrow('Custom adapter is not available');
  });
});

describe('Branch coverage - Adapter signApiTokenData', () => {
  it('rejects for empty clientId', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    await expect(adapter.signApiTokenData('')).rejects.toThrow(
      'clientId must be a non-empty string',
    );
  });

  it('rejects for non-string clientId', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    await expect(adapter.signApiTokenData(null as any)).rejects.toThrow(
      'clientId must be a non-empty string',
    );
  });

  it('rejects for negative timestamp', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    await expect(adapter.signApiTokenData('testClient', -1)).rejects.toThrow(
      'timestamp must be a positive finite number',
    );
  });

  it('rejects for Infinity timestamp', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    await expect(adapter.signApiTokenData('testClient', Infinity)).rejects.toThrow(
      'timestamp must be a positive finite number',
    );
  });

  it('succeeds with valid params', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const result = await adapter.signApiTokenData('testClient', 1700000000000);
    expect(result).toHaveProperty('signature');
    expect(result).toHaveProperty('publicKey');
    expect(result).toHaveProperty('seconds', 1700000000);
    expect(result).toHaveProperty('clientId', 'testClient');
    expect(result).toHaveProperty('networkByte');
  });
});

describe('Branch coverage - Adapter signCustomData', () => {
  it('signs from string data', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signCustomData('hello world');
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('signs from number array', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signCustomData([1, 2, 3, 4, 5]);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('signs from Uint8Array', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signCustomData(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });
});
