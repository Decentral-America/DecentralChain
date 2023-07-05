import { hmac } from './hmac.js';
import { initWasm } from './initWasm.js';
import { sha256 } from './sha256.js';

export async function createSharedKey(
  privateKeyFrom: Uint8Array,
  publicKeyTo: Uint8Array,
  prefix: Uint8Array,
) {
  const [wasm, key] = await Promise.all([initWasm(), sha256(prefix)]);
  const data = wasm.create_shared_key(privateKeyFrom, publicKeyTo);

  return new Uint8Array(await hmac('SHA-256', key, data));
}
