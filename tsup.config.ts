import { defineConfig } from 'tsup';

export default defineConfig([
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
    platform: 'neutral',
    outExtension() {
      return { js: '.mjs' };
    },
  },
  {
    entry: ['src/rsa.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    platform: 'node',
    external: ['node:crypto'],
    outExtension() {
      return { js: '.mjs' };
    },
  },
]);
