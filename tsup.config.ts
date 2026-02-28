import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM + CJS (for Node / bundlers) ────────────────────────────
  {
    entry: ['src/index.ts', 'src/bytes.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' };
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
    footer: {
      js: 'if(typeof module!=="undefined")module.exports=DCCCrypto;',
    },
  },
]);
