import { blake2b } from './blake2b.js';
import { initWasm } from './initWasm.js';
import { keccak } from './keccak.js';
import { sha256 } from './sha256.js';

export async function createPrivateKey(seed: Uint8Array, nonce = 0) {
  const seedBytes = Uint8Array.of(0, 0, 0, 0, ...seed);
  new DataView(seedBytes.buffer).setUint32(0, nonce, false);

  const wasm = await initWasm();

  return wasm.create_private_key(
    new Uint8Array(await sha256(keccak(blake2b(seedBytes)))),
  );
}
