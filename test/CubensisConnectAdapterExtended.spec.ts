import { CubensisConnectAdapter } from '../src/adapters/CubensisConnectAdapter';
import { Adapter } from '../src/adapters/Adapter';
import { SIGN_TYPE } from '../src/prepareTx';

// Mock API for CubensisConnect
function createMockApi(overrides: any = {}) {
  const defaultState = {
    locked: false,
    account: {
      address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    },
    txVersion: null,
  };

  return {
    publicState: vi.fn().mockResolvedValue({ ...defaultState, ...overrides }),
    signTransaction: vi.fn().mockResolvedValue(JSON.stringify({ proofs: ['sig1'] })),
    signOrder: vi.fn().mockResolvedValue(JSON.stringify({ signature: 'orderSig' })),
    signCancelOrder: vi.fn().mockResolvedValue(JSON.stringify({ signature: 'cancelSig' })),
    signRequest: vi.fn().mockResolvedValue('requestSig'),
    signCustomData: vi.fn().mockResolvedValue({ signature: 'customSig' }),
    auth: vi.fn().mockResolvedValue({ signature: 'authSig' }),
    on: vi.fn(),
    initialPromise: Promise.resolve(null as any), // filled below
  };
}

describe('CubensisConnectAdapter - extended coverage', () => {
  let mockApi: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    // Reset static state
    (CubensisConnectAdapter as any)._api = undefined;
    (CubensisConnectAdapter as any)._state = undefined;
    (CubensisConnectAdapter as any)._onUpdateCb = [];
    (CubensisConnectAdapter as any)._getApiCb = undefined;
    (CubensisConnectAdapter as any)._txVersion = undefined;

    mockApi = createMockApi();
    // Self-reference for initialPromise
    mockApi.initialPromise = Promise.resolve(mockApi);

    // Set up the adapter with the mock
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
    CubensisConnectAdapter.setApiExtension(() => ({
      initialPromise: Promise.resolve(mockApi),
    }));
  });

  afterEach(() => {
    // Clean up
    (CubensisConnectAdapter as any)._api = undefined;
    (CubensisConnectAdapter as any)._state = undefined;
    (CubensisConnectAdapter as any)._onUpdateCb = [];
    (CubensisConnectAdapter as any)._getApiCb = undefined;
  });

  describe('static isAvailable', () => {
    it('throws code 0 when no API is installed', async () => {
      (CubensisConnectAdapter as any)._api = undefined;
      (CubensisConnectAdapter as any)._getApiCb = undefined;
      await expect(CubensisConnectAdapter.isAvailable(87)).rejects.toMatchObject({ code: 0 });
    });

    it('throws code 5 when no network code', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      (Adapter as any)._code = undefined;
      await expect(CubensisConnectAdapter.isAvailable()).rejects.toMatchObject({ code: 5 });
    });

    it('throws code 1 when publicState throws', async () => {
      const badApi = createMockApi();
      badApi.publicState = vi.fn().mockRejectedValue(new Error('denied'));
      (CubensisConnectAdapter as any)._api = badApi;
      await expect(CubensisConnectAdapter.isAvailable(87)).rejects.toMatchObject({ code: 1 });
    });

    it('throws code 2 when no account in state', async () => {
      const noAccountApi = createMockApi({ account: null });
      (CubensisConnectAdapter as any)._api = noAccountApi;
      await expect(CubensisConnectAdapter.isAvailable(87)).rejects.toMatchObject({ code: 2 });
    });

    it('throws code 3 when address is invalid for network', async () => {
      // Use a syntactically valid base58 address that fails network code check
      const wrongNetApi = createMockApi({
        account: { address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM', publicKey: 'pk' },
      });
      (CubensisConnectAdapter as any)._api = wrongNetApi;
      // networkCode 84 = 'T' (testnet), address is for mainnet 'W'
      await expect(CubensisConnectAdapter.isAvailable(84)).rejects.toMatchObject({ code: 3 });
    });

    it('returns true when everything is valid', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      const result = await CubensisConnectAdapter.isAvailable(87);
      expect(result).toBe(true);
    });

    it('updates txVersion from state', async () => {
      const customVersions = { [SIGN_TYPE.TRANSFER]: [5] };
      const versionApi = createMockApi({ txVersion: customVersions });
      (CubensisConnectAdapter as any)._api = versionApi;
      await CubensisConnectAdapter.isAvailable(87);
      expect((CubensisConnectAdapter as any)._txVersion).toEqual(customVersions);
    });
  });

  describe('static getUserList', () => {
    it('returns account list from publicState', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      const users = await CubensisConnectAdapter.getUserList();
      expect(users).toEqual([
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
      ]);
    });
  });

  describe('static setApiExtension', () => {
    it('accepts object directly', () => {
      const ext = { initialPromise: Promise.resolve(mockApi) };
      CubensisConnectAdapter.setApiExtension(ext);
      expect((CubensisConnectAdapter as any)._getApiCb).toBeDefined();
      expect(typeof (CubensisConnectAdapter as any)._getApiCb).toBe('function');
    });

    it('accepts a function', () => {
      const fn = () => ({ initialPromise: Promise.resolve(mockApi) });
      CubensisConnectAdapter.setApiExtension(fn);
      expect((CubensisConnectAdapter as any)._getApiCb).toBe(fn);
    });

    it('resets cached API', () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      CubensisConnectAdapter.setApiExtension(null);
      expect((CubensisConnectAdapter as any)._api).toBeUndefined();
    });
  });

  describe('static initOptions', () => {
    it('calls setApiExtension and _initExtension', () => {
      const extension = { initialPromise: Promise.resolve(mockApi) };
      // Set api so publicState doesn't throw
      (CubensisConnectAdapter as any)._api = mockApi;
      CubensisConnectAdapter.initOptions({ networkCode: 87, extension });
    });
  });

  describe('instance methods', () => {
    let adapter: CubensisConnectAdapter;

    beforeEach(() => {
      (CubensisConnectAdapter as any)._api = mockApi;
      adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
    });

    it('getSyncAddress returns address', () => {
      expect(adapter.getSyncAddress()).toBe('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM');
    });

    it('getSyncPublicKey returns public key', () => {
      expect(adapter.getSyncPublicKey()).toBe('FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28');
    });

    it('getPublicKey resolves with public key', async () => {
      await expect(adapter.getPublicKey()).resolves.toBe(
        'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
      );
    });

    it('getAddress resolves', async () => {
      await expect(adapter.getAddress()).resolves.toBe('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM');
    });

    it('getSeed rejects', async () => {
      await expect(adapter.getSeed()).rejects.toThrow('Method "getSeed" is not available!');
    });

    it('getEncodedSeed rejects', async () => {
      await expect(adapter.getEncodedSeed()).rejects.toThrow(
        'Method "getEncodedSeed" is not available!',
      );
    });

    it('getPrivateKey rejects', async () => {
      await expect(adapter.getPrivateKey()).rejects.toThrow('No private key');
    });

    it('signData throws', async () => {
      await expect(adapter.signData(new Uint8Array())).rejects.toThrow(
        'Method "signData" is not available!',
      );
    });

    it('getSignVersions returns tx versions', () => {
      (CubensisConnectAdapter as any)._txVersion = { [SIGN_TYPE.TRANSFER]: [2, 3] };
      const versions = adapter.getSignVersions();
      expect(versions[SIGN_TYPE.TRANSFER]).toEqual([2, 3]);
    });

    it('signRequest calls signRequest on API', async () => {
      const sig = await adapter.signRequest(new Uint8Array([1, 2, 3]), undefined, {
        type: 'someType',
      });
      expect(sig).toBe('requestSig');
      expect(mockApi.signRequest).toHaveBeenCalled();
    });

    it('signRequest with customData calls signCustomData', async () => {
      const sig = await adapter.signRequest(new Uint8Array([1, 2, 3]), undefined, {
        type: 'customData',
      });
      expect(sig).toBe('customSig');
      expect(mockApi.signCustomData).toHaveBeenCalled();
    });

    it('signTransaction parses proofs from response', async () => {
      const sig = await adapter.signTransaction(new Uint8Array([1, 2, 3]), {}, { type: 4 } as any);
      expect(sig).toBe('sig1');
    });

    it('signTransaction uses signature field over proofs', async () => {
      mockApi.signTransaction.mockResolvedValue(
        JSON.stringify({ signature: 'directSig', proofs: ['otherSig'] }),
      );
      const sig = await adapter.signTransaction(new Uint8Array([1, 2, 3]), {}, { type: 4 } as any);
      expect(sig).toBe('directSig');
    });

    it('signTransaction throws on empty response', async () => {
      mockApi.signTransaction.mockResolvedValue(JSON.stringify({ proofs: [] }));
      await expect(
        adapter.signTransaction(new Uint8Array([1, 2, 3]), {}, { type: 4 } as any),
      ).rejects.toThrow('CubensisConnect returned empty signature and no proofs');
    });

    it('signOrder CREATE_ORDER calls signOrder', async () => {
      const sig = await adapter.signOrder(new Uint8Array([1, 2, 3]), {}, {
        type: SIGN_TYPE.CREATE_ORDER,
      } as any);
      expect(sig).toBe('orderSig');
      expect(mockApi.signOrder).toHaveBeenCalled();
    });

    it('signOrder CANCEL_ORDER calls signCancelOrder', async () => {
      const sig = await adapter.signOrder(new Uint8Array([1, 2, 3]), {}, {
        type: SIGN_TYPE.CANCEL_ORDER,
      } as any);
      expect(sig).toBe('cancelSig');
      expect(mockApi.signCancelOrder).toHaveBeenCalled();
    });

    it('signOrder default type calls signRequest', async () => {
      const sig = await adapter.signOrder(new Uint8Array([1, 2, 3]), {}, {
        type: SIGN_TYPE.MATCHER_ORDERS,
      } as any);
      expect(sig).toBe('requestSig');
      expect(mockApi.signRequest).toHaveBeenCalled();
    });

    it('signOrder throws on empty response for CREATE_ORDER', async () => {
      mockApi.signOrder.mockResolvedValue(JSON.stringify({}));
      await expect(
        adapter.signOrder(new Uint8Array([1, 2, 3]), {}, { type: SIGN_TYPE.CREATE_ORDER } as any),
      ).rejects.toThrow('CubensisConnect returned empty signature and no proofs');
    });

    it('onDestroy calls cb immediately if already destroyed', () => {
      (adapter as any)._needDestroy = true;
      const cb = vi.fn();
      adapter.onDestroy(cb);
      expect(cb).toHaveBeenCalled();
    });

    it('onDestroy queues cb if not destroyed', () => {
      const cb = vi.fn();
      adapter.onDestroy(cb);
      expect(cb).not.toHaveBeenCalled();
      expect((adapter as any)._onDestroyCb).toContain(cb);
    });
  });

  describe('instance isAvailable', () => {
    it('resolves when address matches', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isAvailable()).resolves.toBeUndefined();
    });

    it('rejects with code 4 when locked', async () => {
      const lockedApi = createMockApi({ locked: true });
      (CubensisConnectAdapter as any)._api = lockedApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isAvailable()).rejects.toMatchObject({ code: 4 });
    });

    it('resolves when locked but ignoreLocked is true', async () => {
      const lockedApi = createMockApi({ locked: true });
      (CubensisConnectAdapter as any)._api = lockedApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isAvailable(true)).resolves.toBeUndefined();
    });

    it('rejects with code 5 when account does not match', async () => {
      const wrongAccountApi = createMockApi({
        account: { address: '3PBQthisIsDifferent111111111' },
      });
      (CubensisConnectAdapter as any)._api = wrongAccountApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isAvailable()).rejects.toMatchObject({ code: 5 });
    });

    it('re-throws code 3 errors from static isAvailable', async () => {
      // When static isAvailable throws code 3, instance isAvailable should propagate it
      const code3Api = createMockApi();
      // First call to static isAvailable within instance isAvailable triggers code 3
      let callCount = 0;
      code3Api.publicState = vi.fn().mockImplementation(async () => {
        callCount++;
        // Return valid state for constructor but throw on isAvailable check
        if (callCount <= 1) {
          return { locked: false, account: { address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM' } };
        }
        throw Object.assign(new Error('Selected network incorrect'), { code: 3 });
      });
      (CubensisConnectAdapter as any)._api = code3Api;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isAvailable()).rejects.toMatchObject({ code: 3 });
    });
  });

  describe('isLocked', () => {
    it('resolves when locked', async () => {
      const lockedApi = createMockApi({ locked: true });
      (CubensisConnectAdapter as any)._api = lockedApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      await expect(adapter.isLocked()).resolves.toBeUndefined();
    });

    it('resolves undefined when not locked', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );
      const result = await adapter.isLocked();
      expect(result).toBeUndefined();
    });
  });

  describe('_updateState deduplication', () => {
    it('does not call callbacks when state is unchanged', () => {
      const cb = vi.fn();
      CubensisConnectAdapter.onUpdate(cb);
      const state1 = { locked: false, account: { address: 'test' } };
      const state2 = { locked: false, account: { address: 'test' } };
      // Call with equal but different objects; after first call, _state is set
      (CubensisConnectAdapter as any)._updateState(state1);
      // Second call with deep-equal state should be filtered by ramda equals
      (CubensisConnectAdapter as any)._updateState(state2);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('calls callbacks when state changes', () => {
      const cb = vi.fn();
      CubensisConnectAdapter.onUpdate(cb);
      (CubensisConnectAdapter as any)._updateState({ locked: false });
      (CubensisConnectAdapter as any)._updateState({ locked: true });
      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('onUpdate / offUpdate', () => {
    it('registers and unregisters callbacks', () => {
      const cb = vi.fn();
      CubensisConnectAdapter.onUpdate(cb);
      expect((CubensisConnectAdapter as any)._onUpdateCb).toContain(cb);
      CubensisConnectAdapter.offUpdate(cb);
      expect((CubensisConnectAdapter as any)._onUpdateCb).not.toContain(cb);
    });
  });

  describe('handleUpdate triggers destroy', () => {
    it('marks adapter as destroyed when different account detected', () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      const adapter = new CubensisConnectAdapter(
        {
          address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        },
        'W',
      );

      const destroyCb = vi.fn();
      adapter.onDestroy(destroyCb);

      // Simulate update with different account
      (adapter as any).handleUpdate({
        locked: false,
        account: { address: 'differentAddress' },
      });

      expect(adapter.isDestroyed()).toBe(true);
      expect(destroyCb).toHaveBeenCalled();
    });
  });

  describe('_initExtension', () => {
    it('returns resolve when no getApiCb is set', async () => {
      (CubensisConnectAdapter as any)._api = undefined;
      (CubensisConnectAdapter as any)._getApiCb = undefined;
      const result = await (CubensisConnectAdapter as any)._initExtension();
      expect(result).toBeUndefined();
    });

    it('returns existing initialPromise if _api is set', async () => {
      (CubensisConnectAdapter as any)._api = mockApi;
      (CubensisConnectAdapter as any)._api.initialPromise = Promise.resolve('existing');
      const result = await (CubensisConnectAdapter as any)._initExtension();
      expect(result).toBe('existing');
    });
  });
});
