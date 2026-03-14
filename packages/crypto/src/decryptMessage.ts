import { decryptAesEcb } from './decryptAesEcb.js';
import { hmac } from './hmac.js';

export async function decryptMessage(sharedKey: Uint8Array, input: Uint8Array) {
  const cek = decryptAesEcb(sharedKey, input.subarray(1, 49)).subarray(0, 32);
  const counter = input.subarray(113, 129);

  const [cekCounterHmac, message] = await Promise.all([
    hmac(
      'SHA-256',
      sharedKey as Uint8Array<ArrayBuffer>,
      Uint8Array.of(...cek, ...counter) as Uint8Array<ArrayBuffer>,
    ),
    crypto.subtle
      .importKey('raw', cek as Uint8Array<ArrayBuffer>, 'AES-CTR', false, ['decrypt'])
      .then((importedKey) =>
        crypto.subtle.decrypt(
          { counter: counter as Uint8Array<ArrayBuffer>, length: counter.length, name: 'AES-CTR' },
          importedKey,
          input.subarray(129) as Uint8Array<ArrayBuffer>,
        ),
      ),
  ]);

  const expectedCekHmac = new Uint8Array(cekCounterHmac);
  let diff = 0;
  for (let i = 0; i < expectedCekHmac.length; i++) {
    diff |= (expectedCekHmac[i] ?? 0) ^ (input[49 + i] ?? 0);
  }
  if (diff !== 0) {
    throw new Error('Invalid key');
  }

  const messageHmac = new Uint8Array(await hmac('SHA-256', cek, message));

  diff = 0;
  for (let i = 0; i < messageHmac.length; i++) {
    diff |= (messageHmac[i] ?? 0) ^ (input[81 + i] ?? 0);
  }
  if (diff !== 0) {
    throw new Error('Invalid message');
  }

  return new Uint8Array(message);
}
