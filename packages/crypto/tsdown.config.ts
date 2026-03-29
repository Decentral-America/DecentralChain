import { defineConfig } from 'tsdown';

export default defineConfig({
  // Keep the wasm-pack output external — do not copy or inline it.
  // The published package ships both dist/ and pkg/ at the same level.
  // node:fs/promises is a conditional dynamic import (Node.js path only);
  // explicitly external so rolldown doesn't warn on neutral platform.
  deps: { neverBundle: [/^\.\.\/pkg\//, /^node:/] },
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
  unbundle: true,
});
