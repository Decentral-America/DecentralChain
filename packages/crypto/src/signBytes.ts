import { sign_bytes } from '../pkg/waves_crypto';
import { initWasm } from './initWasm';

export function signBytes(privateKey: Uint8Array, bytes: Uint8Array) {
  initWasm();

  return sign_bytes(
    privateKey,
    bytes,
    crypto.getRandomValues(new Uint8Array(64))
  );
}
