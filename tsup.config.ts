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
  external: ['@waves/ride-lang', '@waves/ride-repl', '@waves/ts-lib-crypto'],
  clean: true,
  outDir: 'dist',
});
