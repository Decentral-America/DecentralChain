import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2024',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'OrderPairs',
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    platform: 'browser',
  },
]);
