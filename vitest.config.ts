import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      exclude: ['test/**', 'node_modules/**', 'dist/**', '.history/**', '*.config.*'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
