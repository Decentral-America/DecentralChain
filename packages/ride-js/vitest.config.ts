import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // The @waves/ts-lib-crypto ESM bundle is broken (Buffer.from undefined
      // at module init). Force the CJS build which works fine in Node.
      // NOTE: This is an npm package path resolution, not branding.
      '@waves/ts-lib-crypto': path.resolve('node_modules/@waves/ts-lib-crypto/cjs/index.cjs'),
    },
  },
  test: {
    clearMocks: true,
    coverage: {
      include: ['src/**/*.js'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 65,
        functions: 74,
        lines: 85,
        statements: 84,
      },
    },
    environment: 'node',
    globals: true,
    include: ['test/**/*.spec.{ts,js}'],
    reporters: ['default'],
    testTimeout: 60_000,
  },
});
