import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM (for Node / bundlers) ──────────────────────────────────
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2024',
    minify: false,
    splitting: false,
  },
]);
