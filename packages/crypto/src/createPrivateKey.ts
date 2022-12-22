import { create_private_key } from '../pkg/waves_crypto';
import { blake2b } from './blake2b';
import { initWasm } from './initWasm';
import { keccak } from './keccak';
import { sha256 } from './sha256';
import { stringToBytes } from './utf-8';

export async function createPrivateKey(seed: string, nonce = 0) {
  const seedBytes = Uint8Array.of(0, 0, 0, 0, ...stringToBytes(seed));
  new DataView(seedBytes.buffer).setUint32(0, nonce, false);

  initWasm();

  return create_private_key(
    new Uint8Array(await sha256(keccak(blake2b(seedBytes))))
  );
}
