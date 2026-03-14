import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 15,
        functions: 15,
        lines: 15,
        statements: 15,
      },
    },
    include: ['test/**/*.test.ts'],
  },
});
