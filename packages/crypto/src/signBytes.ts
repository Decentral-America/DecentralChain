import { initWasm } from './initWasm.js';

export async function signBytes(privateKey: Uint8Array, bytes: Uint8Array) {
  const wasm = await initWasm();

  return wasm.sign_bytes(
    privateKey,
    bytes,
    crypto.getRandomValues(new Uint8Array(64)),
  );
}
