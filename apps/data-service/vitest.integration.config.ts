import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.int.ts', 'src/**/*.test.int.ts', 'src/**/*.int.testnet.ts'],
    testTimeout: 30_000,
  },
});
