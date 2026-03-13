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
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    exclude: [
      'test/integration/**',
      'test/test.spec.ts',
      'test/nodeInteraction.spec.ts',
      'test/proto-serialize.spec.ts',
    ],
    globals: true,
    include: ['test/**/*.spec.ts'],
    reporters: ['default'],
    testTimeout: 30000,
  },
});
