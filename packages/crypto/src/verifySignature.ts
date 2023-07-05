import { initWasm } from './initWasm.js';

export async function verifySignature(
  publicKey: Uint8Array,
  bytes: Uint8Array,
  signature: Uint8Array,
) {
  const wasm = await initWasm();

  return wasm.verify_signature(publicKey, bytes, signature);
}
