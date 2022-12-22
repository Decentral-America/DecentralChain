import { decryptAesEcb } from './decryptAesEcb';
import { hmac } from './hmac';

export async function decryptMessage(sharedKey: Uint8Array, input: Uint8Array) {
  const cek = decryptAesEcb(sharedKey, input.subarray(1, 49)).subarray(0, 32);
  const counter = input.subarray(113, 129);

  const [cekCounterHmac, message] = await Promise.all([
    hmac('SHA-256', sharedKey, Uint8Array.of(...cek, ...counter)),
    crypto.subtle
      .importKey('raw', cek, 'AES-CTR', false, ['decrypt'])
      .then(importedKey =>
        crypto.subtle.decrypt(
          { name: 'AES-CTR', counter, length: counter.length },
          importedKey,
          input.subarray(129)
        )
      ),
  ]);

  if (new Uint8Array(cekCounterHmac).some((v, i) => v !== input[49 + i])) {
    throw new Error('Invalid key');
  }

  const messageHmac = new Uint8Array(await hmac('SHA-256', cek, message));

  if (messageHmac.some((v, i) => v !== input[81 + i])) {
    throw new Error('Invalid message');
  }

  return new Uint8Array(message);
}
