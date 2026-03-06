import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // The @waves/ts-lib-crypto ESM bundle is broken (Buffer.from undefined
      // at module init). Force the CJS build which works fine in Node.
      '@waves/ts-lib-crypto': path.resolve('node_modules/@waves/ts-lib-crypto/cjs/index.cjs'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.{ts,js}'],
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    reporters: ['default'],
  },
});
