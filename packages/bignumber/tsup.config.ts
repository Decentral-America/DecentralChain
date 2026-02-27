import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM + CJS (for Node / bundlers) ────────────────────────────
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      };
    },
  },

  // ── UMD (browser global) ───────────────────────────────────────
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'BigNumber',
    outDir: 'dist',
    minify: true,
    sourcemap: true,
    target: 'es2024',
    outExtension() {
      return { js: '.umd.min.js' };
    },
    footer: {
      // Re-export named exports as UMD globals
      js: 'if(typeof module!=="undefined")module.exports=BigNumber;',
    },
  },
]);
