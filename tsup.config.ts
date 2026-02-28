import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM (for Node / bundlers) ───────────────────────────────────
  {
    entry: ['src/index.ts', 'src/bytes.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    outExtension() {
      return { js: '.mjs' };
    },
  },
  // ── UMD / IIFE (browser global) ───────────────────────────────
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'DCCCrypto',
    outDir: 'dist',
    minify: true,
    sourcemap: true,
    target: 'es2024',
    outExtension() {
      return { js: '.umd.min.js' };
    },
  },
]);
