import { initSync as initWasmSync } from '../pkg';
import { base64Decode } from './base64';

let isWasmInitialized = false;

export function initWasm() {
  if (!isWasmInitialized) {
    // we work around the fact that vite replaces import.meta.url with
    // self.location, which doesn't exist in node.js
    const polyfillSelf = typeof self === 'undefined';
    if (polyfillSelf) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.self = { location: import.meta.url } as any;
    }

    initWasmSync(
      base64Decode(
        new URL('../pkg/waves_crypto_bg.wasm?inline', import.meta.url)
          .toString()
          .split(',')[1]
      )
    );

    if (polyfillSelf) {
      // @ts-ignore ts requires self to be optional, but it's not
      delete global.self;
    }

    isWasmInitialized = true;
  }
}
