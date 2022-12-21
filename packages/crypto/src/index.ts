import { blake2b as nobleBlake2b } from '@noble/hashes/blake2b';
import { keccak_256 as keccak } from '@noble/hashes/sha3';
import { base58 } from '@scure/base';

import * as __wasm from '../pkg';
import { decryptAesEcb, encryptAesEcb } from './aesEcb';
import { seedWords } from './seedWords';

const getWasm = (() => {
  let initialized = false;
  let wasm: typeof __wasm;

  return () => {
    if (!initialized) {
      // we work around the fact that vite replaces import.meta.url with
      // self.location, which doesn't exist in node.js
      const polyfillSelf = typeof self === 'undefined';
      if (polyfillSelf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.self = { location: import.meta.url } as any;
      }

      const url = new URL(
        '../pkg/waves_crypto_bg.wasm?inline',
        import.meta.url
      );

      if (polyfillSelf) {
        // @ts-ignore ts requires self to be optional, but it's not
        delete global.self;
      }

      __wasm.initSync(base64Decode(url.toString().split(',')[1]));
      initialized = true;
      wasm = __wasm;
    }

    return wasm;
  };
})();

export function base16Decode(input: string) {
  return Uint8Array.from(Array.from(input.matchAll(/[0-9a-f]{2}/gi)), ([h]) =>
    parseInt(h, 16)
  );
}

export function base16Encode(input: Uint8Array) {
  return Array.from(input, b => b.toString(16).padStart(2, '0')).join('');
}

export function base58Decode(input: string) {
  return base58.decode(input);
}

export function base58Encode(input: Uint8Array) {
  return base58.encode(input);
}

export function base64Decode(input: string) {
  return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

export function base64Encode(input: Uint8Array) {
  return btoa(Array.from(input, b => String.fromCharCode(b)).join(''));
}

export function blake2b(input: Uint8Array) {
  return nobleBlake2b(input, { dkLen: 32 });
}

export function bytesToString(input: Uint8Array) {
  return new TextDecoder().decode(input);
}

export function createAddress(publicKey: Uint8Array, chainId = 87) {
  const bytes = new Uint8Array(26);
  bytes.set([1, chainId], 0);
  bytes.set(keccak(blake2b(publicKey)).subarray(0, 20), 2);
  bytes.set(keccak(blake2b(bytes.subarray(0, 22))).subarray(0, 4), 22);
  return bytes;
}

export async function createPrivateKey(seed: string, nonce = 0) {
  const seedBytes = Uint8Array.of(0, 0, 0, 0, ...stringToBytes(seed));
  new DataView(seedBytes.buffer).setUint32(0, nonce, false);

  const wasm = getWasm();

  return wasm.create_private_key(
    new Uint8Array(await sha256(keccak(blake2b(seedBytes))))
  );
}

export function createPublicKey(privateKey: Uint8Array) {
  const wasm = getWasm();

  return wasm.create_public_key(privateKey);
}

export async function createSharedKey(
  privateKeyFrom: Uint8Array,
  publicKeyTo: Uint8Array,
  prefix: Uint8Array
) {
  const wasm = getWasm();

  const key = await sha256(prefix);
  const data = wasm.create_shared_key(privateKeyFrom, publicKeyTo);

  return new Uint8Array(await hmac('SHA-256', key, data));
}

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

export async function decryptSeed(
  input: Uint8Array,
  password: string,
  hashRounds = 5000
) {
  const [key, iv] = await deriveSeedEncryptionKey(
    password,
    hashRounds,
    input.subarray(8, 16)
  );

  const importedKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-CBC',
    false,
    ['decrypt']
  );

  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv, length: iv.length },
      importedKey,
      input.subarray(16)
    )
  );
}

async function deriveSeedEncryptionKey(
  password: string,
  hashRounds: number,
  salt: Uint8Array
) {
  let hashedPassword = password;

  while (hashRounds--) {
    hashedPassword = base16Encode(
      new Uint8Array(await sha256(stringToBytes(hashedPassword)))
    );
  }

  const hashedPasswordBytes = Uint8Array.from(
    hashedPassword.split('').map(c => c.charCodeAt(0))
  );

  const wasm = getWasm();

  const part1 = wasm.md5(Uint8Array.of(...hashedPasswordBytes, ...salt));

  const part2 = wasm.md5(
    Uint8Array.of(...part1, ...hashedPasswordBytes, ...salt)
  );

  const key = Uint8Array.of(...part1, ...part2);
  const iv = wasm.md5(Uint8Array.of(...part2, ...hashedPasswordBytes, ...salt));

  return [key, iv];
}

export async function encryptMessage(
  sharedKey: Uint8Array,
  message: Uint8Array
) {
  const cek = crypto.getRandomValues(new Uint8Array(32));
  const counter = crypto.getRandomValues(new Uint8Array(16));

  const encryptedCek = encryptAesEcb(
    sharedKey,
    Uint8Array.of(...cek, ...Array(16).fill(16))
  );

  const [cekCounterHmac, messageHmac, encryptedMessage] = await Promise.all([
    hmac('SHA-256', sharedKey, Uint8Array.of(...cek, ...counter)).then(
      buffer => new Uint8Array(buffer)
    ),
    hmac('SHA-256', cek, message).then(buffer => new Uint8Array(buffer)),
    crypto.subtle
      .importKey('raw', cek, 'AES-CTR', false, ['encrypt'])
      .then(importedKey =>
        crypto.subtle.encrypt(
          { name: 'AES-CTR', counter, length: counter.length },
          importedKey,
          message
        )
      )
      .then(buffer => new Uint8Array(buffer)),
  ]);

  return Uint8Array.of(
    1,
    ...encryptedCek,
    ...cekCounterHmac,
    ...messageHmac,
    ...counter,
    ...encryptedMessage
  );
}

export async function encryptSeed(
  input: string,
  password: string,
  hashRounds = 5000
) {
  const salt = crypto.getRandomValues(new Uint8Array(8));
  const [key, iv] = await deriveSeedEncryptionKey(password, hashRounds, salt);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-CBC',
    false,
    ['encrypt']
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv, length: iv.length },
      importedKey,
      stringToBytes(input)
    )
  );

  return Uint8Array.of(...stringToBytes('Salted__'), ...salt, ...encrypted);
}

export function generateRandomSeed(wordsCount = 15) {
  return Array.from(
    crypto.getRandomValues(new Uint32Array(wordsCount)),
    x => seedWords[x % seedWords.length]
  ).join(' ');
}

async function hmac(hash: 'SHA-256', key: BufferSource, data: BufferSource) {
  const name = 'HMAC';

  const importedKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name, hash },
    true,
    ['sign']
  );

  return crypto.subtle.sign(name, importedKey, data);
}

export { keccak };

function sha256(data: Uint8Array) {
  return crypto.subtle.digest('SHA-256', data);
}

export function signBytes(privateKey: Uint8Array, bytes: Uint8Array) {
  const wasm = getWasm();

  return wasm.sign_bytes(
    privateKey,
    bytes,
    crypto.getRandomValues(new Uint8Array(64))
  );
}

export function stringToBytes(input: string) {
  return new TextEncoder().encode(input);
}

export function verifyAddress(
  bytes: Uint8Array,
  {
    chainId: expectedChainId,
    publicKey: expectedPublicKey,
  }: { chainId?: number; publicKey?: Uint8Array } = {}
) {
  return (
    bytes.length === 26 &&
    bytes[0] === 1 &&
    (expectedChainId == null || bytes[1] === expectedChainId) &&
    (expectedPublicKey == null ||
      keccak(blake2b(expectedPublicKey))
        .subarray(0, 20)
        .every((b, i) => bytes[2 + i] === b)) &&
    keccak(blake2b(bytes.subarray(0, 22)))
      .subarray(0, 4)
      .every((b, i) => bytes[22 + i] === b)
  );
}

export function verifySignature(
  publicKey: Uint8Array,
  bytes: Uint8Array,
  signature: Uint8Array
) {
  const wasm = getWasm();

  return wasm.verify_signature(publicKey, bytes, signature);
}
