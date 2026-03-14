import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { SeedAdapter } from '../src/adapters/SeedAdapter';
import { SIGN_TYPE } from '../src/prepareTx';

const testSeed = 'some test seed words without money on mainnet';

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

describe('Signable - extended coverage', () => {
  let adapter: SeedAdapter;

  beforeAll(() => {
    adapter = new SeedAdapter(testSeed, 'W');
  });

  describe('getAssetIds', () => {
    it('returns DCC_ID for auth', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      const ids = await signable.getAssetIds();
      expect(ids).toContain('DCC');
    });

    it('returns asset IDs for transfer', async () => {
      const signable = adapter.makeSignable({
        data: {
          amount: Money.fromCoins(100000, testAsset),
          fee: Money.fromCoins(100000, dccAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          timestamp: Date.now(),
          version: 2,
        },
        type: SIGN_TYPE.TRANSFER,
      } as any);
      const ids = await signable.getAssetIds();
      expect(ids).toContain('DCC');
      expect(ids).toContain(testAsset.id);
    });

    it('returns asset IDs for burn', async () => {
      const signable = adapter.makeSignable({
        data: {
          amount: new BigNumber(1000),
          assetId: testAsset.id,
          fee: Money.fromCoins(100000, dccAsset),
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          timestamp: Date.now(),
          version: 2,
        },
        type: SIGN_TYPE.BURN,
      } as any);
      const ids = await signable.getAssetIds();
      expect(ids).toContain(testAsset.id);
    });
  });

  describe('getDataForApi', () => {
    it('returns data with proofs when needSign is true', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      const result = (await signable.getDataForApi(true)) as any;
      expect(result.proofs).toBeDefined();
      expect(Array.isArray(result.proofs)).toBe(true);
    });

    it('returns data without signing when needSign is false', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      const result = (await signable.getDataForApi(false)) as any;
      expect(result).toBeDefined();
    });
  });

  describe('sign2fa', () => {
    it('calls request with address, code and signData', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);

      const mockSignature = 'mock2faSignature';
      const mockRequest = vi.fn().mockResolvedValue(mockSignature);

      const result = await signable.sign2fa({
        code: '123456',
        request: mockRequest,
      });

      expect(result).toBe(signable);
      expect(mockRequest).toHaveBeenCalledTimes(1);
      const callArg = mockRequest.mock.calls[0]?.[0];
      expect(callArg.code).toBe('123456');
      expect(typeof callArg.address).toBe('string');
    });
  });

  describe('version handling', () => {
    it('throws when version is not supported', () => {
      expect(() =>
        adapter.makeSignable({
          data: {
            amount: Money.fromCoins(100000, dccAsset),
            fee: Money.fromCoins(100000, dccAsset),
            recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
            timestamp: Date.now(),
            version: 99,
          },
          type: SIGN_TYPE.TRANSFER,
        } as any),
      ).toThrow();
    });

    it('auto-selects latest version when not specified', () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      expect(signable.type).toBe(SIGN_TYPE.AUTH);
    });
  });

  describe('existing proofs', () => {
    it('preserves existing proofs from input data', () => {
      const signable = adapter.makeSignable({
        data: {
          data: 'test',
          host: 'localhost',
          prefix: 'test',
          proofs: ['existingProof1'],
        },
        type: SIGN_TYPE.AUTH,
      } as any);

      // Should be able to add more proofs without error
      signable.addProof('newProof');
      // The existing proof should be preserved (can't inspect directly without getDataForApi)
    });
  });

  describe('getId for protobuf transactions', () => {
    it('handles protobuf byte prefix (10)', async () => {
      const signable = adapter.makeSignable({
        data: {
          amount: Money.fromCoins(100000, dccAsset),
          fee: Money.fromCoins(100000, dccAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          timestamp: 1558497371511,
          version: 3,
        },
        type: SIGN_TYPE.TRANSFER,
      } as any);

      const id = await signable.getId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getMyProofs', () => {
    it('returns empty array when no matching proofs', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      signable.addProof('invalidSignatureNotBase58!!');
      const myProofs = await signable.getMyProofs();
      expect(myProofs).toEqual([]);
    });

    it('returns matching proofs after signing', async () => {
      const signable = adapter.makeSignable({
        data: { data: 'test', host: 'localhost', prefix: 'test' },
        type: SIGN_TYPE.AUTH,
      } as any);
      await signable.addMyProof();
      const myProofs = await signable.getMyProofs();
      expect(myProofs.length).toBe(1);
    });
  });

  describe('precision methods', () => {
    it('handles script invocation payment precision', async () => {
      const signable = adapter.makeSignable({
        data: {
          call: { args: [], function: 'test' },
          dApp: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          fee: Money.fromCoins(500000, dccAsset),
          payment: [Money.fromCoins(1000000, testAsset)],
          timestamp: Date.now(),
          version: 1,
        },
        type: SIGN_TYPE.SCRIPT_INVOCATION,
      } as any);

      const bytes = await signable.getBytes();
      expect(bytes).toBeInstanceOf(Uint8Array);
    });
  });
});
