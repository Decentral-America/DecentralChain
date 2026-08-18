import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
        // Ratchet: raise after each sprint's new test coverage lands.
        // Current baseline includes WsApiContext, useTransactionStream, useStateSubscription.
        // Target: 70% per BULLETPROOF.md — increment per sprint, never decrease.
        branches: 5,
        functions: 4,
        lines: 3,
        statements: 5,
      },
    },
    environment: 'jsdom',
    exclude: ['node_modules', 'dist', 'electron'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
