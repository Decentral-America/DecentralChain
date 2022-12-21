import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^@noble\/hashes/, '@scure/base'],
    },
    sourcemap: true,
    target: 'esnext',
  },
  plugins: [wasm()],
  test: {
    globals: true,
    includeSource: ['index.ts'],
    watchExclude: ['**/node_modules/**'],
  },
});
