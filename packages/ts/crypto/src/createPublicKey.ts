import { initWasm } from './initWasm.js';

export async function createPublicKey(privateKey: Uint8Array) {
  const wasm = await initWasm();

  return wasm.create_public_key(privateKey);
}
