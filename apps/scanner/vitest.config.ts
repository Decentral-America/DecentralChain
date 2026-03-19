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
      exclude: [
        // Framework boilerplate — no business logic
        'src/root.tsx',
        'src/entry.client.tsx',
        'src/entry.server.tsx',
        'src/routes.ts',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        // Generated shadcn/ui Radix wrappers — no business logic
        'src/components/ui/**',
        // Type declaration files — no runtime code
        'src/types/**',
        // Page orchestrators — covered by Playwright E2E (26 tests across all routes)
        'src/pages/**',
        'src/Layout.tsx',
        // Static i18n data file — pure key/value map, no branches
        'src/components/utils/translations.tsx',
        // Trivial singleton config — no testable logic
        'src/lib/query-client.ts',
        // SSR resource route — integration-only
        'src/routes/sitemap.xml.ts',
        // Test infrastructure
        'src/test/**',
      ],
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
