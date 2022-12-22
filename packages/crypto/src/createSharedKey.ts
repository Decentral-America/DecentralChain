import { create_shared_key } from '../pkg/waves_crypto';
import { hmac } from './hmac';
import { initWasm } from './initWasm';
import { sha256 } from './sha256';

export async function createSharedKey(
  privateKeyFrom: Uint8Array,
  publicKeyTo: Uint8Array,
  prefix: Uint8Array
) {
  initWasm();

  const key = await sha256(prefix);
  const data = create_shared_key(privateKeyFrom, publicKeyTo);

  return new Uint8Array(await hmac('SHA-256', key, data));
}
