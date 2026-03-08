import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      // Note: V8 coverage thresholds are not meaningful for a types-only package
      // (0 executable statements). Type safety is validated via expectTypeOf tests.
    },
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
