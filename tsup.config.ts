import { defineConfig } from 'tsup';

const shared = {
  entry: ['src/index.js'],
  sourcemap: true,
  splitting: false,
  treeshake: false,
  target: 'es2024',
  shims: true,
  platform: 'node',
  external: ['@waves/ride-lang', '@waves/ride-repl', '@waves/ts-lib-crypto', 'axios'],
};

export default defineConfig([
  // ESM (primary output for Node / bundlers)
  {
    ...shared,
    format: ['esm'],
    dts: { resolve: false },
    clean: true,
    outDir: 'dist',
  },
  // CJS (legacy compat — documented requirement for explorer)
  {
    ...shared,
    format: ['cjs'],
    dts: false,
    clean: false,
    outDir: 'dist',
  },
]);
