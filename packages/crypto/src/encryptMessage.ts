import { encryptAesEcb } from './encryptAesEcb.js';
import { hmac } from './hmac.js';

export async function encryptMessage(
  sharedKey: Uint8Array,
  message: Uint8Array,
) {
  const cek = crypto.getRandomValues(new Uint8Array(32));
  const counter = crypto.getRandomValues(new Uint8Array(16));

  const encryptedCek = encryptAesEcb(
    sharedKey,
    Uint8Array.of(...cek, ...Array(16).fill(16)),
  );

  const [cekCounterHmac, messageHmac, encryptedMessage] = await Promise.all([
    hmac('SHA-256', sharedKey, Uint8Array.of(...cek, ...counter)).then(
      buffer => new Uint8Array(buffer),
    ),
    hmac('SHA-256', cek, message).then(buffer => new Uint8Array(buffer)),
    crypto.subtle
      .importKey('raw', cek, 'AES-CTR', false, ['encrypt'])
      .then(importedKey =>
        crypto.subtle.encrypt(
          { name: 'AES-CTR', counter, length: counter.length },
          importedKey,
          message,
        ),
      )
      .then(buffer => new Uint8Array(buffer)),
  ]);

  return Uint8Array.of(
    1,
    ...encryptedCek,
    ...cekCounterHmac,
    ...messageHmac,
    ...counter,
    ...encryptedMessage,
  );
}
