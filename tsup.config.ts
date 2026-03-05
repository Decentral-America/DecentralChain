import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM-only (for Node / bundlers) ───────────────────────────
  {
    entry: ['src/index.ts'],
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
]);
