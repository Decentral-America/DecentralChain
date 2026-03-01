import { ecb, cbc, ctr, cfb, gcm } from '@noble/ciphers/aes.js';
import { equalBytes } from '@noble/curves/utils.js';
import { type TBinaryIn, type TRawStringIn, type TBytes, type AESMode } from './interface';
import { randomBytes } from './random';
import { _fromRawIn, _fromIn } from '../conversions/param';
import { hmacSHA256, sha256 } from './hashing';
import { concat, split } from './concat-split';
import curve25519 from '../libs/curve25519';
import { stringToBytes, bytesToString } from '../conversions/string-bytes';

/** Encrypt data using AES with the specified mode. */
export const aesEncrypt = (
  data: TBinaryIn,
  key: TBinaryIn,
  mode: AESMode = 'CBC',
  iv?: TBinaryIn,
): TBytes => {
  const keyBytes = _fromIn(key);
  const dataBytes = _fromIn(data);
  const ivBytes = iv ? _fromIn(iv) : undefined;
  const zeroIV = new Uint8Array(16);

  switch (mode) {
    case 'CBC':
      return cbc(keyBytes, ivBytes ?? zeroIV).encrypt(dataBytes);
    case 'CTR':
      return ctr(keyBytes, ivBytes ?? zeroIV).encrypt(dataBytes);
    case 'ECB':
      return ecb(keyBytes).encrypt(dataBytes);
    case 'CFB':
      return cfb(keyBytes, ivBytes ?? zeroIV).encrypt(dataBytes);
    case 'GCM':
      return gcm(keyBytes, ivBytes ?? zeroIV).encrypt(dataBytes);
    case 'OFB':
      throw new Error(
        'OFB mode is no longer supported. Use CTR (streaming), CBC (block), or GCM (authenticated) instead.',
      );
    default:
      throw new TypeError(`Unsupported AES mode: ${String(mode)}`);
  }
};

/** Decrypt AES-encrypted data with the specified mode. */
export const aesDecrypt = (
  encryptedData: TBinaryIn,
  key: TBinaryIn,
  mode: AESMode = 'CBC',
  iv?: TBinaryIn,
): TBytes => {
  const keyBytes = _fromIn(key);
  const dataBytes = _fromIn(encryptedData);
  const ivBytes = iv ? _fromIn(iv) : undefined;
  const zeroIV = new Uint8Array(16);

  switch (mode) {
    case 'CBC':
      return cbc(keyBytes, ivBytes ?? zeroIV).decrypt(dataBytes);
    case 'CTR':
      return ctr(keyBytes, ivBytes ?? zeroIV).decrypt(dataBytes);
    case 'ECB':
      return ecb(keyBytes).decrypt(dataBytes);
    case 'CFB':
      return cfb(keyBytes, ivBytes ?? zeroIV).decrypt(dataBytes);
    case 'GCM':
      return gcm(keyBytes, ivBytes ?? zeroIV).decrypt(dataBytes);
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
  const sharedKey = curve25519.sharedKey(_fromIn(privateKeyFrom), _fromIn(publicKeyTo));
  const prefixHash = sha256(_fromRawIn(prefix));
  return hmacSHA256(sharedKey, prefixHash);
};
