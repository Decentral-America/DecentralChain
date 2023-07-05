import * as wasm from '../pkg/waves_crypto.js';

let isWasmInitialized = false;

export async function initWasm() {
  if (!isWasmInitialized) {
    await wasm.default(
      typeof self === 'undefined'
        ? import(/* webpackIgnore: true */ 'node:fs/promises').then(fs =>
            fs.readFile(
              new URL('../pkg/waves_crypto_bg.wasm', import.meta.url),
            ),
          )
        : undefined,
    );

    isWasmInitialized = true;
  }

  return wasm;
}
