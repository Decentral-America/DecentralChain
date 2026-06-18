/**
 * vitest.http.config.ts
 *
 * Separate Vitest configuration for HTTP-level integration tests.
 * Includes *.http.spec.ts files (in src/http/**) and the test/app-factory.ts
 * helper. Env vars are seeded via setupFiles so loadConfig() does not throw.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.http.spec.ts', 'src/**/__test__/**'],
      include: ['src/http/**/*.ts', 'src/middleware/**/*.ts'],
      provider: 'v8',
    },
    environment: 'node',
    exclude: ['src/**/*.int.ts', 'src/**/*.test.int.ts', 'src/**/*.int.testnet.ts'],
    globals: true,
    include: ['src/**/*.http.spec.ts'],
    // Seed process.env before any module under test is imported
    setupFiles: ['src/test/setup.ts'],
  },
});
