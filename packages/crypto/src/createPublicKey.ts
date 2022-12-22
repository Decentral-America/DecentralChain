import { create_public_key } from '../pkg/waves_crypto';
import { initWasm } from './initWasm';

export function createPublicKey(privateKey: Uint8Array) {
  initWasm();

  return create_public_key(privateKey);
}
