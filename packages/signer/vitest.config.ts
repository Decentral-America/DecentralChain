import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/types/**', 'src/index.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    environment: 'node',
    globals: true,
    include: ['test/**/*.spec.ts'],
  },
});
