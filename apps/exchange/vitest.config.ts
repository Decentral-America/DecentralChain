import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    // charting_library is a proprietary ambient module (type declarations only).
    // Vite's import-analysis plugin still tries to resolve it at test time even
    // for all-type imports, so we serve an empty ESM stub to unblock resolution.
    {
      load(id: string) {
        return id === '\0charting_library' ? 'export {};' : null;
      },
      name: 'vitest-charting-library-stub',
      resolveId(id: string) {
        return id === 'charting_library' ? '\0charting_library' : null;
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'data-service': path.resolve(import.meta.dirname, './src/types/data-service'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/types/**',
        'src/locales/**',
        'src/i18n/locales/**',
        'src/lib/data-service/**', // Legacy data-service — separate audit
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: {
        // Phase 1 migrated project thresholds — ratchet to 80% post-stabilization
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    environment: 'jsdom',
    exclude: ['node_modules', 'dist', 'electron'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
