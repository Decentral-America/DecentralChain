import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  dts: { resolve: false },
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'es2024',
  shims: true,
  platform: 'node',
  // NOTE: These are npm package names resolved by Node — not branding.
  // TODO: Replace with @decentralchain/ride-lang and @decentralchain/ride-repl once forked
  external: ['@waves/ride-lang', '@waves/ride-repl', '@waves/ts-lib-crypto'],
  clean: true,
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' };
  },
});
