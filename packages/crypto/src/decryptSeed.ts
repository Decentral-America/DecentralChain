import { deriveSeedEncryptionKey } from './deriveSeedEncryptionKey.js';

export async function decryptSeed(
  input: Uint8Array,
  password: Uint8Array,
  hashRounds = 5000,
) {
  const [key, iv] = await deriveSeedEncryptionKey(
    password,
    hashRounds,
    input.subarray(8, 16),
  );

  const importedKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-CBC',
    false,
    ['decrypt'],
  );

  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv, length: iv.length },
      importedKey,
      input.subarray(16),
    ),
  );
}
