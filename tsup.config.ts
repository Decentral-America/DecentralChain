import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM (for Node / bundlers) ────────────────────────────
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
      return {
        js: '.mjs',
      };
    },
  },
  // ── UMD / IIFE (browser global) — uncomment if HAS_BROWSER_BUNDLE ──
  // {
  //   entry: ['src/index.ts'],
  //   format: ['iife'],
  //   globalName: 'BigNumber',
  //   outDir: 'dist',
  //   minify: true,
  //   sourcemap: true,
  //   target: 'es2024',
  //   outExtension() {
  //     return { js: '.umd.min.js' };
  //   },
  //   footer: {
  //     js: 'if(typeof module!=="undefined")module.exports=BigNumber;',
  //   },
  // },
]);
