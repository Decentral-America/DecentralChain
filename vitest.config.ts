import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/bytes.ts', 'src/libs/**'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 80,
        statements: 85,
      },
    },
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
