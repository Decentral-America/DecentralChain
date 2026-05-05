import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.test.ts', 'src/**/__test__/**'],
      include: ['src/**/*.ts'],
      provider: 'v8',
    },
    environment: 'node',
    exclude: ['src/**/*.int.ts', 'src/**/*.test.int.ts', 'src/**/*.int.testnet.ts'],
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
