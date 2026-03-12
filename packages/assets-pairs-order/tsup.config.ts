import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2024',
  splitting: false,
  treeshake: true,
  outExtension() {
    return { js: '.mjs' };
  },
});
