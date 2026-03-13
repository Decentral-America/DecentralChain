import { Adapter } from '../src/adapters/Adapter';
import { CustomAdapter, type IUserApi } from '../src/adapters/CustomAdapter';
import { SIGN_TYPE } from '../src/prepareTx';

describe('CustomAdapter', () => {
  const mockUserApi: IUserApi = {
    getAddress: () => '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
    getPublicKey: () => 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    isAvailable: () => true,
    signData: async (_bytes) => 'mockDataSignature',
    signOrder: async (_bytes) => 'mockOrderSignature',
    signRequest: async (_bytes) => 'mockSignature',
    signTransaction: async (_bytes) => 'mockTxSignature',
    type: 'customTest',
  };

  beforeAll(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  it('constructs with valid user API', () => {
    const adapter = new CustomAdapter(mockUserApi);
    expect(adapter.type).toBe('customTest');
    expect(adapter.isDestroyed()).toBe(false);
  });

  it('throws when no user API is provided', () => {
    expect(() => new CustomAdapter(null as any)).toThrow();
  });

  it('returns correct address and public key', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    expect(adapter.getSyncAddress()).toBe('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM');
    expect(adapter.getSyncPublicKey()).toBe('FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28');
    expect(await adapter.getPublicKey()).toBe('FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28');
    expect(await adapter.getAddress()).toBe('3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM');
  });

  it('isAvailable resolves when userApi says available', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    await expect(adapter.isAvailable()).resolves.toBeUndefined();
  });

  it('isAvailable rejects when userApi says unavailable', async () => {
    const unavailableApi: IUserApi = {
      ...mockUserApi,
      isAvailable: () => false,
    };
    const adapter = new CustomAdapter(unavailableApi);
    await expect(adapter.isAvailable()).rejects.toThrow('Custom adapter is not available');
  });

  it('signRequest delegates to userApi', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    const sig = await adapter.signRequest(new Uint8Array([1, 2, 3]));
    expect(sig).toBe('mockSignature');
  });

  it('signTransaction delegates to userApi', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    const sig = await adapter.signTransaction(new Uint8Array([1, 2, 3]), {}, {});
    expect(sig).toBe('mockTxSignature');
  });

  it('signOrder delegates to userApi', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    const sig = await adapter.signOrder(new Uint8Array([1, 2, 3]), {}, {});
    expect(sig).toBe('mockOrderSignature');
  });

  it('signData delegates to userApi', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    const sig = await adapter.signData(new Uint8Array([1, 2, 3]));
    expect(sig).toBe('mockDataSignature');
  });

  it('throws when signRequest is not implemented', () => {
    const noSignApi: IUserApi = {
      ...mockUserApi,
      signRequest: undefined,
    };
    const adapter = new CustomAdapter(noSignApi);
    expect(() => adapter.signRequest(new Uint8Array([1]))).toThrow('No method to sign request');
  });

  it('throws when signTransaction is not implemented', () => {
    const noSignApi: IUserApi = {
      ...mockUserApi,
      signTransaction: undefined,
    };
    const adapter = new CustomAdapter(noSignApi);
    expect(() => adapter.signTransaction(new Uint8Array([1]), {}, {})).toThrow(
      'No method to sign transactions',
    );
  });

  it('throws when signOrder is not implemented', () => {
    const noSignApi: IUserApi = {
      ...mockUserApi,
      signOrder: undefined,
    };
    const adapter = new CustomAdapter(noSignApi);
    expect(() => adapter.signOrder(new Uint8Array([1]), {}, {})).toThrow('No method to sign order');
  });

  it('throws when signData is not implemented', () => {
    const noSignApi: IUserApi = {
      ...mockUserApi,
      signData: undefined,
    };
    const adapter = new CustomAdapter(noSignApi);
    expect(() => adapter.signData(new Uint8Array([1]))).toThrow('No method to sign custom data');
  });

  it('getSeed rejects with error', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    await expect(adapter.getSeed()).rejects.toThrow('Method "getSeed" is not available!');
  });

  it('getEncodedSeed rejects with error', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    await expect(adapter.getEncodedSeed()).rejects.toThrow(
      'Method "getEncodedSeed" is not available!',
    );
  });

  it('getPrivateKey rejects with error', async () => {
    const adapter = new CustomAdapter(mockUserApi);
    await expect(adapter.getPrivateKey()).rejects.toThrow('No private key');
  });

  it('getSignVersions returns correct version map', () => {
    const adapter = new CustomAdapter(mockUserApi);
    const versions = adapter.getSignVersions();
    expect(versions[SIGN_TYPE.AUTH]).toEqual([1]);
    expect(versions[SIGN_TYPE.TRANSFER]).toEqual([2]);
    expect(versions[SIGN_TYPE.CREATE_ORDER]).toEqual([1, 2, 3, 4]);
  });

  it('static isAvailable returns true', async () => {
    expect(await CustomAdapter.isAvailable()).toBe(true);
  });

  it('static initOptions delegates to Adapter', () => {
    const code = 'T'.charCodeAt(0);
    CustomAdapter.initOptions({ networkCode: code });
    const adapter = new CustomAdapter(mockUserApi);
    expect(adapter.getNetworkByte()).toBe(code);
    // Reset
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });
});
