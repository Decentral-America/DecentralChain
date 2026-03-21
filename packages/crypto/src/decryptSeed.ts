import { deriveSeedEncryptionKey } from './deriveSeedEncryptionKey.js';

/**
 * Decrypts a blob produced by `encryptSeed`.
 *
 * Expected format: [16-byte salt][12-byte nonce][ciphertext + 16-byte GCM auth tag]
 * Throws if the password is wrong (GCM authentication tag mismatch).
 */
export async function decryptSeed(input: Uint8Array, password: Uint8Array): Promise<Uint8Array> {
  const salt = input.subarray(0, 16);
  const nonce = input.subarray(16, 28);
  const ciphertext = input.subarray(28);

  const key = await deriveSeedEncryptionKey(password, salt);

  return new Uint8Array(
    await crypto.subtle.decrypt(
      { iv: nonce as Uint8Array<ArrayBuffer>, name: 'AES-GCM' },
      key,
      ciphertext as Uint8Array<ArrayBuffer>,
    ),
  );
}
