import { seedUtils } from '../src';

const { Seed, generateNewSeed, strengthenPassword } = seedUtils;

describe('seed', () => {
  it('should decrypt seed', () => {
    const encrypted =
      'U2FsdGVkX19tuxILcDC5gj/GecPmDGEc2l51pCwdBOdtVclJ5rMT4M3Ns9Q+G4rV8wzrVTkhc/nnne5iI9ki/5uEqkGDheAi8xjQTF+MY4Q=';
    expect(seedUtils.decryptSeed(encrypted, 'asd')).toEqual(
      'asd asd asd asd asd asd asd asd asd asd asd asd1',
    );
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

  it('should encrypt and decrypt seed phrase', () => {
    const seed = new Seed(validPhrase);
    const encrypted = seed.encrypt('strongpassword');
    expect(typeof encrypted).toBe('string');
    const decrypted = Seed.decryptSeedPhrase(encrypted, 'strongpassword');
    expect(decrypted).toBe(validPhrase);
  });

  it('should throw on decryption with wrong password', () => {
    const encrypted = Seed.encryptSeedPhrase(validPhrase, 'correctpw');
    expect(() => Seed.decryptSeedPhrase(encrypted, 'wrongpw')).toThrow('password is wrong');
  });

  it('should throw when encrypting seed phrase that is too short', () => {
    expect(() => Seed.encryptSeedPhrase('short', 'password')).toThrow('too short');
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
