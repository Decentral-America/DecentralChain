import { ecb, cbc, ctr, cfb, gcm } from '@noble/ciphers/aes.js';
import { equalBytes } from '@noble/curves/utils.js';
import { type TBinaryIn, type TRawStringIn, type TBytes, type AESMode } from './interface';
import { randomBytes } from './random';
import { _fromRawIn, _fromIn } from '../conversions/param';
import { hmacSHA256, sha256 } from './hashing';
import { concat, split } from './concat-split';
import curve25519 from '../libs/curve25519';
import { stringToBytes, bytesToString } from '../conversions/string-bytes';

/**
 * Encrypt data using AES with the specified mode.
 *
 * An IV/nonce is **required** for CBC, CTR, CFB, and GCM modes.
 * Omitting it is a critical security error (nonce reuse / deterministic encryption).
 * ECB does not use an IV.
 */
export const aesEncrypt = (
  data: TBinaryIn,
  key: TBinaryIn,
  mode: AESMode = 'CBC',
  iv?: TBinaryIn,
): TBytes => {
  const keyBytes = _fromIn(key);
  const dataBytes = _fromIn(data);
  const ivBytes = iv ? _fromIn(iv) : undefined;

  switch (mode) {
    case 'CBC':
      if (!ivBytes)
        throw new Error('AES-CBC requires an IV. Omitting the IV is a critical security error.');
      return cbc(keyBytes, ivBytes).encrypt(dataBytes);
    case 'CTR':
      if (!ivBytes)
        throw new Error(
          'AES-CTR requires a nonce/IV. Omitting it causes deterministic encryption.',
        );
      return ctr(keyBytes, ivBytes).encrypt(dataBytes);
    case 'ECB':
      return ecb(keyBytes).encrypt(dataBytes);
    case 'CFB':
      if (!ivBytes)
        throw new Error('AES-CFB requires an IV. Omitting the IV is a critical security error.');
      return cfb(keyBytes, ivBytes).encrypt(dataBytes);
    case 'GCM':
      if (!ivBytes)
        throw new Error(
          'AES-GCM requires a unique nonce. Reusing a nonce completely breaks GCM security.',
        );
      return gcm(keyBytes, ivBytes).encrypt(dataBytes);
    case 'OFB':
      throw new Error(
        'OFB mode is no longer supported. Use CTR (streaming), CBC (block), or GCM (authenticated) instead.',
      );
    default:
      throw new TypeError(`Unsupported AES mode: ${String(mode)}`);
  }
};

/**
 * Decrypt AES-encrypted data with the specified mode.
 *
 * An IV/nonce is **required** for CBC, CTR, CFB, and GCM modes.
 * ECB does not use an IV.
 */
export const aesDecrypt = (
  encryptedData: TBinaryIn,
  key: TBinaryIn,
  mode: AESMode = 'CBC',
  iv?: TBinaryIn,
): TBytes => {
  const keyBytes = _fromIn(key);
  const dataBytes = _fromIn(encryptedData);
  const ivBytes = iv ? _fromIn(iv) : undefined;

  switch (mode) {
    case 'CBC':
      if (!ivBytes) throw new Error('AES-CBC requires an IV for decryption.');
      return cbc(keyBytes, ivBytes).decrypt(dataBytes);
    case 'CTR':
      if (!ivBytes) throw new Error('AES-CTR requires a nonce/IV for decryption.');
      return ctr(keyBytes, ivBytes).decrypt(dataBytes);
    case 'ECB':
      return ecb(keyBytes).decrypt(dataBytes);
    case 'CFB':
      if (!ivBytes) throw new Error('AES-CFB requires an IV for decryption.');
      return cfb(keyBytes, ivBytes).decrypt(dataBytes);
    case 'GCM':
      if (!ivBytes) throw new Error('AES-GCM requires a nonce for decryption.');
      return gcm(keyBytes, ivBytes).decrypt(dataBytes);
    case 'OFB':
      throw new Error(
        'OFB mode is no longer supported. Use CTR (streaming), CBC (block), or GCM (authenticated) instead.',
      );
    default:
      throw new TypeError(`Unsupported AES mode: ${String(mode)}`);
  }
};

/** Encrypt a message using a shared key (Curve25519 ECDH + AES-CTR + HMAC). */
export const messageEncrypt = (sharedKey: TBinaryIn, message: string): TBytes => {
  const version = Uint8Array.from([1]);
  const CEK = randomBytes(32);
  const IV = randomBytes(16);
  const m = stringToBytes(message);

  const Cc = aesEncrypt(m, CEK, 'CTR', IV);
  const Ccek = aesEncrypt(CEK, sharedKey, 'ECB');
  const Mhmac = hmacSHA256(m, CEK);
  const CEKhmac = hmacSHA256(concat(CEK, IV), sharedKey);

  const packageBytes = concat(version, Ccek, CEKhmac, Mhmac, IV, Cc);

  return packageBytes;
};

/** Decrypt a message encrypted with {@link messageEncrypt}. */
export const messageDecrypt = (sharedKey: TBinaryIn, encryptedMessage: TBinaryIn): string => {
  const parts = split(encryptedMessage, 1, 48, 32, 32, 16);
  const Ccek = parts[1];
  const _CEKhmac = parts[2];
  const _Mhmac = parts[3];
  const iv = parts[4];
  const Cc = parts[5];

  if (!Ccek || !_CEKhmac || !_Mhmac || !iv || !Cc) {
    throw new Error('Failed to decrypt: malformed encrypted message');
  }

  const CEK = aesDecrypt(Ccek, sharedKey, 'ECB');

  const CEKhmac = _fromIn(hmacSHA256(concat(CEK, iv), _fromIn(sharedKey)));

  if (!equalBytes(CEKhmac, _fromIn(_CEKhmac))) throw new Error('Invalid key');

  const M = aesDecrypt(Cc, CEK, 'CTR', iv);
  const Mhmac = _fromIn(hmacSHA256(M, CEK));

  if (!equalBytes(Mhmac, _fromIn(_Mhmac))) throw new Error('Invalid message');

  return bytesToString(M);
};

/** Derive a shared key from a Curve25519 private key and public key using ECDH. */
export const sharedKey = (
  privateKeyFrom: TBinaryIn,
  publicKeyTo: TBinaryIn,
  prefix: TRawStringIn,
): TBytes => {
  const raw = curve25519.sharedKey(_fromIn(privateKeyFrom), _fromIn(publicKeyTo));

  // Reject small-subgroup / all-zeros DH result — indicates a malicious or invalid public key.
  if (raw.every((b) => b === 0)) {
    throw new Error(
      'Invalid ECDH result: shared secret is the zero point (malicious or invalid public key).',
    );
  }

  const prefixHash = sha256(_fromRawIn(prefix));
  return hmacSHA256(raw, prefixHash);
};
