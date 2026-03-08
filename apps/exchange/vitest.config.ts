import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'data-service': path.resolve(__dirname, './src/types/data-service'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'electron'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/types/**',
        'src/locales/**',
        'src/i18n/locales/**',
        'src/lib/data-service/**', // Legacy data-service — separate audit
      ],
      thresholds: {
        // Phase 1 migrated project thresholds — ratchet to 80% post-stabilization
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
