import { type TBase64 } from './interface';
import { bytesToString, stringToBytes } from '../conversions/string-bytes';
import { md5 } from '../libs/md5';
import { concat } from './concat-split';
import { aesDecrypt, aesEncrypt } from './encryption';
import { base16Encode, base64Decode, base64Encode } from '../conversions/base-xx';
import { sha256 } from './hashing';
import { randomBytes } from './random';

function strengthenPassword(password: string, rounds = 5000): string {
  while (rounds--) {
    const bytes = stringToBytes(password);
    password = base16Encode(sha256(bytes));
  }
  return password;
}

/**
 * OpenSSL EVP_BytesToKey with MD5.
 *
 * **Legacy only** — kept for backward compatibility with seeds encrypted by
 * the DecentralChain client & keeper.  New code should prefer PBKDF2 / HKDF.
 */
function evpKdf(passphrase: Uint8Array, salt: Uint8Array, outputLen = 48): Uint8Array {
  const passPlusSalt = concat(passphrase, salt);
  const blocks: Uint8Array[] = [];
  let totalLen = 0;
  let prev = new Uint8Array(0);

  while (totalLen < outputLen) {
    const input = concat(prev, passPlusSalt);
    prev = md5(input);
    blocks.push(prev);
    totalLen += prev.length;
  }

  return concat(...blocks).slice(0, outputLen);
}

/**
 * Encrypts arbitrary utf8 string with utf8 password. Evp key deriving function is used to get encryption key and IV from
 * password. AES-CBC algorithm is used for encryption. Output format is base64 encoded OpenSSL
 * @param seed - utf8 string to encrypt
 * @param password - utf8 password
 * @param encryptionRounds - how many times password will be hashed. Default = 5000
 */
export const encryptSeed = (seed: string, password: string, encryptionRounds?: number): TBase64 => {
  const passphrase = strengthenPassword(password, encryptionRounds);
  const salt = randomBytes(8);
  const keyIv = evpKdf(stringToBytes(passphrase, 'raw'), salt);
  const key = keyIv.slice(0, 32);
  const iv = keyIv.slice(32, 48);
  const encrypted = aesEncrypt(stringToBytes(seed), key, 'CBC', iv);
  return base64Encode(concat(stringToBytes('Salted__'), salt, encrypted));
};

/**
 * Decrypt a Base64-encoded encrypted seed using a UTF-8 password.
 * @param encryptedSeed - Base64 encoded encrypted seed (OpenSSL format).
 * @param password - The UTF-8 password used for decryption.
 * @param encryptionRounds - Number of password hashing rounds (default: 5000).
 */
export const decryptSeed = (
  encryptedSeed: TBase64,
  password: string,
  encryptionRounds?: number,
): string => {
  const passphrase = strengthenPassword(password, encryptionRounds);
  const encBytes = base64Decode(encryptedSeed);
  const salt = encBytes.slice(8, 16);
  const keyIv = evpKdf(stringToBytes(passphrase, 'raw'), salt);
  const key = keyIv.slice(0, 32);
  const iv = keyIv.slice(32, 48);
  return bytesToString(aesDecrypt(encBytes.slice(16), key, 'CBC', iv));
};
