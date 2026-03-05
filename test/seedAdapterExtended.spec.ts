import { SeedAdapter } from '../src/adapters/SeedAdapter';
import { libs, seedUtils } from '@decentralchain/transactions';

const testSeed = 'some test seed words without money on mainnet';

describe('SeedAdapter - extended coverage', () => {
  it('constructs from encrypted seed (IUser)', () => {
    const password = 'testPassword';
    const encryptedSeed = seedUtils.Seed.encryptSeedPhrase(testSeed, password);
    const adapter = new SeedAdapter(
      {
        encryptedSeed,
        password,
        encryptionRounds: 5000,
      } as any,
      'W',
    );
    expect(adapter.getSyncAddress()).toBeTruthy();
  });

  it('constructs from base58-encoded seed', () => {
    const encoded = 'base58:' + libs.crypto.base58Encode(libs.crypto.stringToBytes(testSeed));
    const adapter = new SeedAdapter(encoded, 'W');
    expect(adapter.isEncoded).toBe(true);
    expect(adapter.getSyncAddress()).toBeTruthy();
  });

  it('constructs from base58 bytes that cannot decode to string', () => {
    // Create a byte sequence that base58 decodes to something that round-trips differently
    const randomBytes = new Uint8Array([0, 1, 2, 128, 255, 200, 150]);
    const encoded = 'base58:' + libs.crypto.base58Encode(randomBytes);
    const adapter = new SeedAdapter(encoded, 'W');
    expect(adapter.isEncoded).toBe(true);
  });

  it('getEncodedSeed returns the encoded seed', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const encoded = await adapter.getEncodedSeed();
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('getSeed returns the seed phrase', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const seed = await adapter.getSeed();
    expect(seed).toBe(testSeed);
  });

  it('signTransaction delegates to _sign', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signTransaction(new Uint8Array([1, 2, 3]));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('signOrder delegates to _sign', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signOrder(new Uint8Array([4, 5, 6]));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('signData delegates to _sign', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    const sig = await adapter.signData(new Uint8Array([7, 8, 9]));
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('seed encrypt function works', async () => {
    const adapter = new SeedAdapter(testSeed, 'W');
    // Access the seed through the private field to test encrypt
    const seedObj = (adapter as any).seed;
    const encrypted = seedObj.encrypt('password123');
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it('static isAvailable returns true', async () => {
    const result = await SeedAdapter.isAvailable();
    expect(result).toBe(true);
  });
});
