import { defineConfig } from 'tsdown';

export default defineConfig({
  deps: {
    neverBundle: [
      '@decentralchain/ride-lang',
      '@decentralchain/ride-repl',
      '@decentralchain/ts-lib-crypto',
    ],
  },
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  shims: true,
  sourcemap: true,
});
