import { defineConfig } from 'tsdown';

export default defineConfig({
  // Keep the wasm-pack output external — do not copy or inline it.
  // The published package ships both dist/ and pkg/ at the same level.
  deps: { neverBundle: [/^\.\.\/pkg\//] },
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
  unbundle: true,
});
