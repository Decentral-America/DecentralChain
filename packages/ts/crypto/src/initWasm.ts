import * as wasm from '../pkg/decentralchain_crypto.js';

let isWasmInitialized = false;

export async function initWasm() {
  if (!isWasmInitialized) {
    await wasm.default(
      typeof self === 'undefined'
        ? {
            module_or_path: import(/* webpackIgnore: true */ 'node:fs/promises').then((fs) =>
              fs.readFile(new URL('../pkg/decentralchain_crypto_bg.wasm', import.meta.url)),
            ),
          }
        : undefined,
    );

    isWasmInitialized = true;
  }

  return wasm;
}
