import { defineConfig } from 'tsdown';

export default defineConfig({
  // NOTE: These are npm package names resolved by Node — not branding.
  // TODO: Replace with @decentralchain/ride-lang and @decentralchain/ride-repl once forked
  deps: {
    neverBundle: ['@waves/ride-lang', '@waves/ride-repl', '@waves/ts-lib-crypto'],
  },
  dts: true,
  entry: ['src/index.js'],
  format: ['esm'],
  shims: true,
  sourcemap: true,
});
