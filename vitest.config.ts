import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/index.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Note: V8 coverage thresholds are not meaningful for a types-only package
      // (0 executable statements). Type safety is validated via expectTypeOf tests.
    },
    globals: true,
    include: ['test/**/*.spec.ts'],
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
