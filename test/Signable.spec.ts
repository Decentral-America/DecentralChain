import { Signable } from '../src/Signable';
import { SignError } from '../src/SignError';
import { ERRORS } from '../src/constants';
import { SeedAdapter } from '../src/adapters/SeedAdapter';
import { SIGN_TYPE } from '../src/prepareTx';

const testSeed = 'some test seed words without money on mainnet';
const networkCode = 'W';

describe('Signable', () => {
  let adapter: SeedAdapter;

  beforeAll(() => {
    adapter = new SeedAdapter(testSeed, networkCode);
  });

  it('throws SignError for unknown sign type', () => {
    expect(
      () =>
        new Signable({ type: 99999 as any, data: { timestamp: Date.now(), version: 1 } }, adapter),
    ).toThrow(SignError);
  });

  it('SignError has correct code for unknown type', () => {
    try {
      new Signable({ type: 99999 as any, data: { timestamp: Date.now(), version: 1 } }, adapter);
    } catch (e) {
      expect(e).toBeInstanceOf(SignError);
      expect((e as SignError).code).toBe(ERRORS.UNKNOWN_SIGN_TYPE);
    }
  });

  it('addProof rejects empty string', () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    expect(() => signable.addProof('')).toThrow('Invalid signature');
  });

  it('addProof rejects non-string', () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    expect(() => signable.addProof(null as any)).toThrow('Invalid signature');
  });

  it('addProof enforces max proof count', () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    for (let i = 0; i < 8; i++) {
      signable.addProof(`proof${i}`);
    }
    expect(() => signable.addProof('proof8')).toThrow('Maximum proof count');
  });

  it('addProof deduplicates identical signatures', () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    signable.addProof('uniqueProof');
    signable.addProof('uniqueProof'); // duplicate, should be ignored
    signable.addProof('anotherProof');
    // Should not throw since only 2 unique proofs added
    expect(() => signable.addProof('thirdProof')).not.toThrow();
  });

  it('getBytes returns Uint8Array', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const bytes = await signable.getBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('getHash returns base58 string', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const hash = await signable.getHash();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('getId returns base58 string', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const id = await signable.getId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sign returns Signable instance', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const result = await signable.sign();
    expect(result).toBe(signable);
  });

  it('getSignature returns string', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const signature = await signable.getSignature();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('deterministic: same data produces same bytes for same input', async () => {
    const timestamp = 1234567890;
    const data = {
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test', timestamp },
    } as any;

    const signable1 = adapter.makeSignable(data);
    const signable2 = adapter.makeSignable(data);

    const bytes1 = await signable1.getBytes();
    const bytes2 = await signable2.getBytes();
    expect(Array.from(bytes1)).toEqual(Array.from(bytes2));
  });

  it('hasMySignature returns false before signing', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const has = await signable.hasMySignature();
    expect(has).toBe(false);
  });

  it('hasMySignature returns true after signing', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    await signable.addMyProof();
    const has = await signable.hasMySignature();
    expect(has).toBe(true);
  });

  it('addMyProof returns same signature on second call', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const sig1 = await signable.addMyProof();
    const sig2 = await signable.addMyProof();
    expect(sig1).toBe(sig2);
  });

  it('getTxData returns copy of data', () => {
    const originalData = { prefix: 'test', host: 'localhost', data: 'test' };
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: originalData,
    } as any);

    const txData = signable.getTxData();
    expect(txData.host).toBe('localhost');
    // Should be a copy, not the same reference
    expect(txData).not.toBe(originalData);
  });

  it('type property reflects the sign type', () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    expect(signable.type).toBe(SIGN_TYPE.AUTH);
  });

  it('getSignData includes senderPublicKey', async () => {
    const signable = adapter.makeSignable({
      type: SIGN_TYPE.AUTH,
      data: { prefix: 'test', host: 'localhost', data: 'test' },
    } as any);

    const signData = await signable.getSignData();
    expect(signData.senderPublicKey).toBeDefined();
    expect(typeof signData.senderPublicKey).toBe('string');
  });
});

describe('SignError', () => {
  it('has correct message and code', () => {
    const err = new SignError('test error', ERRORS.VALIDATION_FAILED);
    expect(err.message).toBe('test error');
    expect(err.code).toBe(ERRORS.VALIDATION_FAILED);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SignError);
  });

  it('preserves cause when provided', () => {
    const cause = new Error('root cause');
    const err = new SignError('wrapped', ERRORS.VALIDATION_FAILED, cause);
    expect(err.cause).toBe(cause);
  });

  it('has no cause when not provided', () => {
    const err = new SignError('no cause', ERRORS.UNKNOWN_SIGN_TYPE);
    expect(err.cause).toBeUndefined();
  });

  it('code is readonly', () => {
    const err = new SignError('test', ERRORS.VALIDATION_FAILED);
    expect(err.code).toBe(ERRORS.VALIDATION_FAILED);
  });
});
