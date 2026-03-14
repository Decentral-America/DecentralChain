import { Adapter } from '../src/adapters/Adapter';
import { AdapterType } from '../src/adapterType';

// Concrete test adapter since Adapter is abstract
class TestAdapter extends Adapter {
  public static override type = AdapterType.Seed;

  constructor(networkCode?: string | number) {
    super(networkCode);
    this._isDestroyed = false;
  }

  getSyncAddress() {
    return '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM';
  }
  getSyncPublicKey() {
    return 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28';
  }
  getSignVersions(): any {
    return {};
  }
  getPublicKey() {
    return Promise.resolve(this.getSyncPublicKey());
  }
  getAddress() {
    return Promise.resolve(this.getSyncAddress());
  }
  getPrivateKey() {
    return Promise.resolve('testPrivateKey');
  }
  signRequest(_bytes: Uint8Array) {
    return Promise.resolve('testSignature');
  }
  signTransaction(_bytes: Uint8Array) {
    return Promise.resolve('testSignature');
  }
  signOrder(_bytes: Uint8Array) {
    return Promise.resolve('testSignature');
  }
  signData(_bytes: Uint8Array) {
    return Promise.resolve('testSignature');
  }
  getSeed() {
    return Promise.resolve('testSeed');
  }
  getEncodedSeed() {
    return Promise.resolve('encodedSeed');
  }
}

describe('Adapter base class', () => {
  beforeEach(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  it('constructs with string network code', () => {
    const adapter = new TestAdapter('W');
    expect(adapter.getNetworkByte()).toBe('W'.charCodeAt(0));
  });

  it('constructs with numeric network code', () => {
    const adapter = new TestAdapter(87);
    expect(adapter.getNetworkByte()).toBe(87);
  });

  it('constructs using static network code fallback', () => {
    Adapter.initOptions({ networkCode: 84 }); // 'T'
    const adapter = new TestAdapter();
    expect(adapter.getNetworkByte()).toBe(84);
  });

  it('throws if no network code is available', () => {
    // Reset static code
    Adapter.initOptions({ networkCode: 0 as any });
    (Adapter as any)._code = undefined;
    expect(() => new TestAdapter()).toThrow('Network code is required');
  });

  it('isAvailable resolves by default', async () => {
    const adapter = new TestAdapter('W');
    await expect(adapter.isAvailable()).resolves.toBeUndefined();
  });

  it('onDestroy is a no-op by default', () => {
    const adapter = new TestAdapter('W');
    expect(() => adapter.onDestroy(() => {})).not.toThrow();
  });

  it('isDestroyed returns correct state', () => {
    const adapter = new TestAdapter('W');
    expect(adapter.isDestroyed()).toBe(false);
  });

  it('signApiTokenData returns valid structure', async () => {
    const adapter = new TestAdapter('W');
    const timestamp = Date.now();
    const result = await adapter.signApiTokenData('testClient', timestamp);

    expect(result.clientId).toBe('testClient');
    expect(result.networkByte).toBe('W'.charCodeAt(0));
    expect(result.seconds).toBe(Math.floor(timestamp / 1000));
    expect(typeof result.signature).toBe('string');
    expect(typeof result.publicKey).toBe('string');
  });

  it('signApiTokenData rejects with empty clientId', async () => {
    const adapter = new TestAdapter('W');
    await expect(adapter.signApiTokenData('')).rejects.toThrow(
      'clientId must be a non-empty string',
    );
  });

  it('signApiTokenData rejects with invalid timestamp', async () => {
    const adapter = new TestAdapter('W');
    await expect(adapter.signApiTokenData('testClient', -1)).rejects.toThrow(
      'timestamp must be a positive finite number',
    );
  });

  it('signApiTokenData rejects with NaN timestamp', async () => {
    const adapter = new TestAdapter('W');
    await expect(adapter.signApiTokenData('testClient', NaN)).rejects.toThrow(
      'timestamp must be a positive finite number',
    );
  });

  it('static getUserList returns empty array', async () => {
    const result = await Adapter.getUserList();
    expect(result).toEqual([]);
  });

  it('static isAvailable returns false', async () => {
    const result = await Adapter.isAvailable();
    expect(result).toBe(false);
  });

  it('initOptions sets static network code', () => {
    Adapter.initOptions({ networkCode: 84 });
    const adapter = new TestAdapter();
    expect(adapter.getNetworkByte()).toBe(84);
  });
});
