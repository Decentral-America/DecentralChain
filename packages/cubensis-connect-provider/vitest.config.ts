import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['provider/test/**/*.spec.ts'],
    exclude: ['provider/test/ui.spec.ts', 'provider/test/utils/hooks.ts'],
    coverage: {
      provider: 'v8',
      include: ['provider/src/**/*.ts'],
      exclude: ['provider/test/**', 'test-app/**', 'node_modules/**', 'dist/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      reporter: ['default'],
    },
  },
});
