import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/**/*.spec.ts', 'src/seedWords.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
