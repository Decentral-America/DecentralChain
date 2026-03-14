import { defineConfig } from 'tsdown';

export default defineConfig({
  // NOTE: These are npm package names resolved by Node — not branding.
  // TODO: Replace with @decentralchain/ride-lang and @decentralchain/ride-repl once forked
  deps: {
    neverBundle: ['@waves/ride-lang', '@waves/ride-repl', '@waves/ts-lib-crypto'],
  },
  entry: ['src/index.js'],
  shims: true,
  sourcemap: true,
});
