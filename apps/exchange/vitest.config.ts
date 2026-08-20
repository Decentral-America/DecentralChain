import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // Matches vite.config.ts: resolves to the real runtime implementation so
      // it can be mocked with `vi.mock('data-service/...')`. (Previously aliased
      // to `./src/types/data-service`, the *type-only* ambient-declaration file
      // used by tsconfig's `paths` — never a real resolvable directory, so any
      // test importing from `data-service` — mocked or not — failed to resolve.)
      'data-service': path.resolve(import.meta.dirname, './src/lib/data-service'),
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
    /**
     * Vitest's stock 5s was sized for a much smaller suite. The design-system
     * work took this from 418 tests to 911, most of the new ones full jsdom
     * renders that mount a themed page twice (once per mode) and read computed
     * styles back. Run in parallel across every core, those saturate the box
     * and push unrelated tests past 5s — `crypto.test.ts`, which touches no
     * DOM at all, was timing out purely from contention.
     *
     * The symptom was worse than the cause: the same commit reported 911
     * passed, then 4 failed, then 12 failed, then 7, purely on scheduling. A
     * suite that green-lights by luck silently devalues every "verified"
     * claim made against it. Raising the ceiling makes the result a function
     * of the code again. It does not mask a slow test — the median test is
     * milliseconds; this is headroom for the tail under load.
     */
    hookTimeout: 30_000,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,
  },
});
