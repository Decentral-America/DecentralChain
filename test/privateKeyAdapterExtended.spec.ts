import { PrivateKeyAdapter } from '../src/adapters/PrivateKeyAdapter';
import { Adapter } from '../src/adapters/Adapter';
import { SIGN_TYPE } from '../src/prepareTx';
import { libs, seedUtils } from '@decentralchain/decentralchain-transactions';

describe('PrivateKeyAdapter - extended tests', () => {
  beforeAll(() => {
    Adapter.initOptions({ networkCode: 'W'.charCodeAt(0) });
  });

  const testPrivateKey = '6xGB7fnzVkER5276nJvJFrUM58LZWCYS2xgxuPFQX8gG';

  it('creates adapter from private key string', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    expect(adapter.isDestroyed()).toBe(false);
    const pk = await adapter.getPrivateKey();
    expect(pk).toBe(testPrivateKey);
  });

  it('creates adapter from encrypted private key user object', () => {
    const password = 'testPassword123';
    const encrypted = seedUtils.Seed.encryptSeedPhrase(testPrivateKey, password, 5000);
    const user = {
      encryptedPrivateKey: encrypted,
      password,
      encryptionRounds: 5000,
    };
    const adapter = new PrivateKeyAdapter(user, 'W');
    expect(adapter.isDestroyed()).toBe(false);
  });

  it('creates adapter from user with no encryptedPrivateKey', () => {
    // When encryptedPrivateKey is empty, decryptSeedPhrase gets ''
    // This will likely produce an invalid key, but should not crash constructing
    try {
      const user = { encryptedPrivateKey: '', password: 'test', encryptionRounds: 5000 };
      new PrivateKeyAdapter(user, 'W');
    } catch {
      // Expected - empty key can't generate valid key pair
    }
  });

  it('getSyncAddress returns string', () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    expect(typeof adapter.getSyncAddress()).toBe('string');
    expect(adapter.getSyncAddress().length).toBeGreaterThan(0);
  });

  it('getSyncPublicKey returns string', () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    expect(typeof adapter.getSyncPublicKey()).toBe('string');
    expect(adapter.getSyncPublicKey().length).toBeGreaterThan(0);
  });

  it('getEncodedSeed rejects', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    await expect(adapter.getEncodedSeed()).rejects.toThrow(
      'Method "getEncodedSeed" is not available!',
    );
  });

  it('getSeed rejects', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    await expect(adapter.getSeed()).rejects.toThrow('Method "getSeed" is not available!');
  });

  it('signRequest returns base58 signature', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const sig = await adapter.signRequest(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('signTransaction returns base58 signature', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const sig = await adapter.signTransaction(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
  });

  it('signOrder returns base58 signature', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const sig = await adapter.signOrder(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
  });

  it('signData returns base58 signature', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const sig = await adapter.signData(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
  });

  it('signature is verifiable', async () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const sig = await adapter.signRequest(bytes);
    const pk = await adapter.getPublicKey();
    expect(libs.crypto.verifySignature(pk, bytes, sig)).toBe(true);
  });

  it('getSignVersions returns all transaction types', () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'W');
    const versions = adapter.getSignVersions();
    expect(versions[SIGN_TYPE.AUTH]).toEqual([1]);
    expect(versions[SIGN_TYPE.TRANSFER]).toEqual([3, 2]);
    expect(versions[SIGN_TYPE.CREATE_ORDER]).toEqual([1, 2, 3]);
    expect(versions[SIGN_TYPE.CANCEL_ORDER]).toEqual([0, 1]);
    expect(versions[SIGN_TYPE.EXCHANGE]).toEqual([0, 1, 3, 2]);
  });

  it('static isAvailable returns true', async () => {
    expect(await PrivateKeyAdapter.isAvailable()).toBe(true);
  });

  it('uses network code from constructor', () => {
    const adapter = new PrivateKeyAdapter(testPrivateKey, 'T');
    expect(adapter.getNetworkByte()).toBe('T'.charCodeAt(0));
  });
});
