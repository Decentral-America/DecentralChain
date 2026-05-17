import { seedUtils } from '../src';

const { Seed, generateNewSeed, strengthenPassword } = seedUtils;

describe('seed', () => {
  it('seedUtils.decryptSeed is removed — legacy MD5+AES-CBC KDF removed in DCC-192', () => {
    // The top-level decryptSeed was removed in DCC-192.
    // Seed decryption is now handled via @decentralchain/crypto decryptSeed (Argon2id).
    expect(typeof (seedUtils as any).decryptSeed).not.toBe('function');
  });

  it('should generate new seed', () => {
    const seed = seedUtils.generateNewSeed(15);
    expect(seed.split(' ').length).toEqual(15);
  });
});

describe('Seed class', () => {
  const validPhrase = 'asd asd asd asd asd asd asd asd asd asd asd asd1';

  it('should create Seed from valid phrase', () => {
    const seed = new Seed(validPhrase);
    expect(seed.phrase).toBe(validPhrase);
    expect(typeof seed.address).toBe('string');
    expect(typeof seed.keyPair.publicKey).toBe('string');
    expect(typeof seed.keyPair.privateKey).toBe('string');
  });

  it('should create Seed with custom chainId', () => {
    const seed = new Seed(validPhrase, 'T');
    expect(seed.address).toBeDefined();
  });

  it('should throw on short phrase', () => {
    expect(() => new Seed('short')).toThrow('less than allowed');
  });

  it('should be frozen (immutable)', () => {
    const seed = new Seed(validPhrase);
    expect(Object.isFrozen(seed)).toBe(true);
    expect(Object.isFrozen(seed.keyPair)).toBe(true);
  });

  it('Seed instance does not expose encrypt() — legacy KDF removed in DCC-192', () => {
    // Seed.prototype.encrypt was removed in DCC-192 along with MD5+AES-CBC.
    // Use @decentralchain/crypto encryptSeed (Argon2id + XChaCha20-Poly1305) instead.
    const seed = new Seed(validPhrase);
    expect(typeof (seed as any).encrypt).not.toBe('function');
  });

  it('Seed.decryptSeedPhrase is removed — legacy KDF removed in DCC-192', () => {
    // Static Seed.decryptSeedPhrase was removed in DCC-192.
    // Use @decentralchain/crypto decryptSeed (Argon2id + XChaCha20-Poly1305) instead.
    expect(typeof (Seed as any).decryptSeedPhrase).not.toBe('function');
  });

  it('Seed.encryptSeedPhrase is removed — legacy KDF removed in DCC-192', () => {
    // Seed.encryptSeedPhrase was removed in DCC-192 along with the MD5+AES-CBC KDF.
    expect(typeof (Seed as any).encryptSeedPhrase).not.toBe('function');
  });

  it('Seed constructor still enforces minimum phrase length (>= 12 chars)', () => {
    // The min-length guard on Seed construction is preserved post-DCC-192.
    expect(() => Seed.fromExistingPhrase('short')).toThrow('minimum length');
    expect(() => new Seed('short')).toThrow('less than allowed');
  });

  it('should create seed via factory method', () => {
    const seed = Seed.create(15);
    expect(seed.phrase.split(' ').length).toBe(15);
    expect(typeof seed.address).toBe('string');
  });

  it('should create from existing phrase', () => {
    const seed = Seed.fromExistingPhrase(validPhrase);
    expect(seed.phrase).toBe(validPhrase);
  });

  it('fromExistingPhrase should throw on short phrase', () => {
    expect(() => Seed.fromExistingPhrase('short')).toThrow('less than the minimum');
  });
});

describe('generateNewSeed', () => {
  it('should generate seed with default 15 words', () => {
    const seed = generateNewSeed();
    expect(seed.split(' ').length).toBe(15);
  });

  it('should generate seed with specified word count', () => {
    const seed = generateNewSeed(18);
    expect(seed.split(' ').length).toBe(18);
  });
});

describe('strengthenPassword', () => {
  it('should return a hex string', () => {
    const result = strengthenPassword('testpassword', 100);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[0-9a-f]+$/i);
  });

  it('should produce different output for different passwords', () => {
    const a = strengthenPassword('password1', 100);
    const b = strengthenPassword('password2', 100);
    expect(a).not.toBe(b);
  });

  it('should produce consistent output for same input', () => {
    const a = strengthenPassword('test', 100);
    const b = strengthenPassword('test', 100);
    expect(a).toBe(b);
  });

  it('should use default rounds of 5000', () => {
    const result = strengthenPassword('test');
    expect(typeof result).toBe('string');
  });
});
