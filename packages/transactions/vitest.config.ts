import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    exclude: [
      'test/integration/**',
      'test/test.spec.ts',
      'test/nodeInteraction.spec.ts',
      'test/proto-serialize.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    reporters: ['default'],
    testTimeout: 30000,
  },
});
