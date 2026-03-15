import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest base configuration for all @decentralchain/* SDK packages.
 *
 * Usage in per-package vitest.config.ts:
 *
 *   import { mergeConfig } from 'vitest/config';
 *   import baseConfig from '../../vitest.base.config';
 *   export default mergeConfig(baseConfig, { test: { ... } });
 */
export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/index.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    globals: true,
    include: ['test/**/*.spec.ts'],
    reporters: ['default'],
  },
});
