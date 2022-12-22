import { verify_signature } from '../pkg/waves_crypto';
import { initWasm } from './initWasm';

export function verifySignature(
  publicKey: Uint8Array,
  bytes: Uint8Array,
  signature: Uint8Array
) {
  initWasm();

  return verify_signature(publicKey, bytes, signature);
}
