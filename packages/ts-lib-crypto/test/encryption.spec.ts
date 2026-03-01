import { describe, expect, it } from 'vitest';
import {
  aesEncrypt,
  aesDecrypt,
  messageEncrypt,
  messageDecrypt,
  sharedKey,
} from '../src/crypto/encryption';
import { randomBytes } from '../src/crypto/random';
import { stringToBytes, bytesToString } from '../src/conversions/string-bytes';
import { keyPair } from '../src';

describe('AES encryption edge cases', () => {
  const message = 'DecentralChain encryption test';
  const msgBytes = stringToBytes(message);
  const key = randomBytes(32);

  it('encrypts/decrypts with CBC mode and explicit IV', () => {
    const iv = randomBytes(16);
    const enc = aesEncrypt(msgBytes, key, 'CBC', iv);
    const dec = aesDecrypt(enc, key, 'CBC', iv);
    expect(bytesToString(dec)).toEqual(message);
  });

  it('encrypts/decrypts with CFB mode', () => {
    const iv = randomBytes(16);
    const enc = aesEncrypt(msgBytes, key, 'CFB', iv);
    const dec = aesDecrypt(enc, key, 'CFB', iv);
    expect(bytesToString(dec)).toEqual(message);
  });

  it('encrypts/decrypts with OFB mode', () => {
    const iv = randomBytes(16);
    const enc = aesEncrypt(msgBytes, key, 'OFB', iv);
    const dec = aesDecrypt(enc, key, 'OFB', iv);
    expect(bytesToString(dec)).toEqual(message);
  });

  it('encrypts/decrypts with CTR mode', () => {
    const iv = randomBytes(16);
    const enc = aesEncrypt(msgBytes, key, 'CTR', iv);
    const dec = aesDecrypt(enc, key, 'CTR', iv);
    expect(bytesToString(dec)).toEqual(message);
  });

  it('encrypts/decrypts with ECB mode (no IV)', () => {
    const enc = aesEncrypt(msgBytes, key, 'ECB');
    const dec = aesDecrypt(enc, key, 'ECB');
    expect(bytesToString(dec)).toEqual(message);
  });

  it('decrypting with wrong key produces different output', () => {
    const iv = randomBytes(16);
    const enc = aesEncrypt(msgBytes, key, 'CTR', iv);
    const wrongKey = randomBytes(32);
    const dec = aesDecrypt(enc, wrongKey, 'CTR', iv);
    expect(bytesToString(dec)).not.toEqual(message);
  });

  it('CBC decryption with wrong key either throws or produces different output', () => {
    const iv = randomBytes(16);
    const longMsg = stringToBytes('A'.repeat(256));
    const enc = aesEncrypt(longMsg, key, 'CBC', iv);
    const wrongKey = randomBytes(32);
    // Wrong key either causes a padding error (throw) or produces garbage output.
    // Both outcomes confirm the ciphertext is not silently decrypted to the original.
    try {
      const dec = aesDecrypt(enc, wrongKey, 'CBC', iv);
      expect(bytesToString(dec)).not.toEqual('A'.repeat(256));
    } catch (e) {
      expect((e as Error).message).toMatch(/Failed to decrypt/);
    }
  });

  it('accepts number[] as binary input', () => {
    const inputArr = Array.from(msgBytes);
    const enc = aesEncrypt(inputArr, key, 'ECB');
    const dec = aesDecrypt(enc, key, 'ECB');
    expect(bytesToString(dec)).toEqual(message);
  });
});

describe('messageEncrypt / messageDecrypt edge cases', () => {
  it('throws Invalid key when decrypting with wrong shared key', () => {
    const a = keyPair('seed-a-for-test');
    const b = keyPair('seed-b-for-test');
    const c = keyPair('seed-c-different');

    const sk = sharedKey(a.privateKey, b.publicKey, 'dcc');
    const encrypted = messageEncrypt(sk, 'secret message');

    const wrongSk = sharedKey(c.privateKey, b.publicKey, 'dcc');
    // Wrong shared key causes CEK decryption to produce garbage, which triggers
    // either a padding error in aesDecrypt or an HMAC mismatch
    expect(() => messageDecrypt(wrongSk, encrypted)).toThrow();
  });

  it('throws on malformed (too short) encrypted message', () => {
    const sk = randomBytes(32);
    const tooShort = new Uint8Array(10);
    expect(() => messageDecrypt(sk, tooShort)).toThrow();
  });
});
