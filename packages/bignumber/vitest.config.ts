import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/index.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    globals: true,
    include: ['test/**/*.spec.ts'],
    reporters: ['default'],
    typecheck: {
      enabled: true,
    },
  },
});
