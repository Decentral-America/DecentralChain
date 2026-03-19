import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Dedicated Vitest configuration.
 *
 * Intentionally separate from vite.config.ts so that the build uses the full
 * React Router v7 Vite plugin (which requires the HMR preamble injected by the
 * dev server), while tests use the plain @vitejs/plugin-react plugin — which
 * correctly omits react-refresh transforms in non-dev environments and therefore
 * works in jsdom without any `__vite_plugin_react_preamble_installed__` global.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: ['src/root.tsx', 'src/vite-env.d.ts', 'src/**/*.d.ts', 'src/test/**'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    css: true,
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
