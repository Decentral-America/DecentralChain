export async function hmac(
  hash: 'SHA-256',
  key: BufferSource,
  data: BufferSource,
) {
  const name = 'HMAC';

  const importedKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name, hash },
    true,
    ['sign'],
  );

  return crypto.subtle.sign(name, importedKey, data);
}
