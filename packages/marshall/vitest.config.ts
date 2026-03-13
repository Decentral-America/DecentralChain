import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: [
        'src/index.ts',
        'src/libs/parseJsonBigNumber.ts', // vendored third-party code
      ],
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
    include: ['test/**/*.test.ts'],
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
